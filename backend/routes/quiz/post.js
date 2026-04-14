const mongoose = require("mongoose");
const Course = require("../../models/Course");
const { Quiz, Question, QuizAttempt } = require("../../models/quiz");
const { generateQuizQuestions, generateQuestionExplanation } = require("../../services/geminiService");
const { assertCourseAccess, normalizeText, parseQuizAttemptBody } = require("../../utils/CourseUtils");

function registerPostRoutes(router) {
  // Generate AI explanation for a question (must be before /:courseId)
  router.post("/generate-explanation", async (req, res) => {
    try {
      if (!String(process.env.GEMINI_API_KEY || "").trim()) {
        return res.status(503).json({
          message:
            "AI explanation is unavailable: set GEMINI_API_KEY in the backend .env and restart the server.",
        });
      }
      const { questionText, type, options, correctIndex, correctAnswer } = req.body;
      if (!String(questionText || "").trim()) {
        return res.status(400).json({ message: "questionText is required" });
      }
      const explanation = await generateQuestionExplanation({
        questionText: String(questionText).trim(),
        type: type === "short_answer" ? "short_answer" : "mcq",
        options: Array.isArray(options) ? options : undefined,
        correctIndex: typeof correctIndex === "number" ? correctIndex : undefined,
        correctAnswer: correctAnswer != null ? String(correctAnswer) : undefined,
      });
      return res.status(200).json({ explanation });
    } catch (err) {
      console.error("generate-explanation:", err?.message || err);
      return res.status(500).json({ message: "Failed to generate explanation" });
    }
  });

  // Create a new quiz for a course (only if course has enough questions)
  router.post("/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const { questionCount = 5, durationSeconds = 300 } = req.body;

      // Validations
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid courseId" });
      }
      const course = await Course.findById(courseId).lean();
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      const courseName = String(course.name || "").trim();
      const qc = Math.max(1, Math.min(Number(questionCount) || 5, 100));
      const dur = Math.max(30, Math.min(Number(durationSeconds) || 300, 60 * 60));

      // Get Questions
      const candidates = await Question.find({
        course: courseId,
        createdByType: "human",
      }).lean();
      if (candidates.length < qc) {
        return res.status(422).json({
          message: "Not enough HUMAN questions available", // default is 10
          required: qc,
          found: candidates.length,
        });
      }

      const generated = await generateQuizQuestions(courseName, qc, candidates);

      const existingQuestions = await Question.find(
        { course: courseId },
        { question: 1 }
      ).lean();
      const existingSet = new Set(
        existingQuestions.map((q) => normalizeText(q.question))
      );

      // Filter out questions that already exist
      const aiDocs = [];
      for (const q of generated.questions || []) {
        const normalized = normalizeText(q.question);
        if (existingSet.has(normalized)) continue;
        existingSet.add(normalized);
        aiDocs.push({
          ...q,
          course: courseId,
          createdByType: "ai",
        });
      }

      // Check if we have enough unique questions
      if (aiDocs.length < qc) {
        return res.status(422).json({
          message: "Not enough UNIQUE questions generated",
          required: qc,
          generatedUnique: aiDocs.length,
        });
      }

      const saved = await Question.insertMany(aiDocs.slice(0, qc), {
        ordered: true, // stop on first error
      });

      const quiz = await Quiz.create({
        course: courseId,
        questionCount: qc,
        durationSeconds: dur,
        questions: saved.map((d) => d._id),
        meta: generated.meta,
      });
      const populated = await Quiz.findById(quiz._id)
        .populate("questions")
        .lean();
      return res.status(201).json(populated);
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .json({ message: 'Server error creating quiz' });
    }
  });

  // Create a single human-contributed question for a course
  router.post("/:courseId/question", async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.userId;
      const { topic, question, type, explanation, options, correctIndex, correctAnswer } = req.body;

      if (!mongoose.Types.ObjectId.isValid(courseId))
        return res.status(400).json({ message: "Invalid courseId" });

      const doc = {
        course: courseId,
        topic: String(topic || "").trim(),
        question: String(question || "").trim(),
        type: type === "short_answer" ? "short_answer" : "mcq",
        explanation: String(explanation || "").trim(),
        createdByType: "human",
        createdBy: userId,
      };

      // Validate MCQ
      if (doc.type === "mcq") {
        if (!Array.isArray(options) || options.length !== 4 || options.some((o) => typeof o !== "string"))
          return res.status(400).json({ message: "MCQ must have exactly 4 option strings" });
        doc.options = options.map((o) => String(o).trim());
        const idx = Number(correctIndex);
        if (!Number.isInteger(idx) || idx < 0 || idx > 3)
          return res.status(400).json({ message: "correctIndex must be 0–3" });
        doc.correctIndex = idx;
      } else { // Short answer
        doc.correctAnswer = String(correctAnswer ?? "").trim();
      }

      const created = await Question.create(doc);
      return res.status(201).json(created);
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: 'Server error for creating question' });
    }
  });

  // Submit a quiz attempt (answers + score)
  router.post("/quizzes/:quizId/attempts", async (req, res) => {
    try {
      const { quizId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(quizId))
        return res.status(400).json({ message: "Invalid quizId" });
      const quiz = await Quiz.findById(quizId).lean();
      if (!quiz) return res.status(404).json({ message: "Quiz not found" });
      await assertCourseAccess(quiz.course, req.user.userId);

      const p = parseQuizAttemptBody(quiz, req.body);
      if (!p.ok) return res.status(p.status).json({ message: p.message });

      const doc = {
        quiz: quizId,
        course: quiz.course,
        user: req.user.userId,
        score: p.s,
        total: p.t,
        timeTakenSeconds: p.secs,
        answers: p.answers,
        startedAt: p.startedAt ?? new Date(Date.now() - 5 * 60 * 1000), // default 5 minutes ago
        completedAt: p.completedAt ?? new Date(),
      };

      const hadAttempt = await QuizAttempt.exists({
        quiz: quizId,
        user: req.user.userId,
      });

      const saved = await QuizAttempt.findOneAndUpdate(
        { quiz: quizId, user: req.user.userId },
        { $set: doc },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );

      return res.status(hadAttempt ? 200 : 201).json(saved);
    } catch (err) {
      const status = err.status || 500;
      if (status >= 500) console.error("quiz attempt:", err?.message || err);
      return res.status(status).json({ message: err.message || "Server error saving attempt" });
    }
  });
}

module.exports = registerPostRoutes;
