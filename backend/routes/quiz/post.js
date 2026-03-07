const mongoose = require("mongoose");
const { Quiz, Question } = require("../../models/quiz");
const { generateQuizQuestions } = require("../../services/geminiService");

function normalizeText(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Register all POST routes for quiz on the given router.
 * @param {express.Router} router
 */
function registerPostRoutes(router) {
  // Create a new quiz for a course (only if course has enough questions)
  router.post("/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      const { topic, questionCount = 10, durationSeconds = 300 } = req.body;

      if (!mongoose.Types.ObjectId.isValid(courseId))
        return res.status(400).json({ message: "Invalid courseId" });

      const cleanTopic = String(topic || "").trim();
      if (!cleanTopic)
        return res.status(400).json({ message: "topic is required" });

      const qc = Math.max(1, Math.min(Number(questionCount) || 10, 100));
      const dur = Math.max(30, Math.min(Number(durationSeconds) || 300, 60 * 60));

      const candidates = await Question.find({
        course: courseId,
        createdByType: "human",
      }).lean();
      if (candidates.length < qc) {
        return res.status(422).json({
          message: "Not enough HUMAN questions available",
          required: qc,
          found: candidates.length,
        });
      }

      const generated = await generateQuizQuestions(cleanTopic, qc, candidates);

      const existingQuestions = await Question.find(
        { course: courseId },
        { question: 1 }
      ).lean();
      const existingSet = new Set(
        existingQuestions.map((q) => normalizeText(q.question))
      );

      const aiDocs = [];
      for (const q of generated.questions || []) {
        const normalized = normalizeText(q.question);
        if (!normalized) continue;
        if (existingSet.has(normalized)) continue;
        existingSet.add(normalized);
        aiDocs.push({
          ...q,
          course: courseId,
          createdByType: "ai",
        });
      }

      if (aiDocs.length < qc) {
        return res.status(422).json({
          message: "Not enough UNIQUE questions generated",
          required: qc,
          generatedUnique: aiDocs.length,
        });
      }

      const saved = await Question.insertMany(aiDocs.slice(0, qc), {
        ordered: true,
      });

      const quiz = await Quiz.create({
        course: courseId,
        topic: cleanTopic,
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
      return res
        .status(500)
        .json({ message: `Server error creating quiz: ${err.message}` });
    }
  });

  // Submit a quiz attempt (answers + score)
  router.post("/quizzes/:quizId/attempts", (req, res) => {
    // TODO
  });
}

module.exports = registerPostRoutes;
