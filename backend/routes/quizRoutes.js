const express = require("express");
const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");

const { authenticateToken } = require("./authRoutes");
const { generateQuizQuestions, validateQuestion } = require('../services/geminiService');

const router = express.Router();

// normalize: "Hello,   World!!!" → "hello world"
function normalizeText(str) {
    return String(str)
      .toLowerCase()
      .replace(/[^\w\s]/g, "")   // remove punctuation
      .replace(/\s+/g, " ")      // collapse spaces
      .trim();
}

// need route to create a question
// will have basic validation with ai service: 
// Auto-reject or flag, No correct answer, Too short / too vague (“what is this?”), Duplicates (same question wording), Off-topic tags

// Create a new quiz for a course (only if course has enough questions)
router.post("/:courseId", async (req, res) => {
    try {
        const { courseId } = req.params;
        const { topic, questionCount = 10, durationSeconds = 300 } = req.body;
        
        // ---- checks and validation ----
        if (!mongoose.Types.ObjectId.isValid(courseId)) return res.status(400).json({ message: "Invalid courseId" });
        
        const cleanTopic = String(topic || "").trim();
        if (!cleanTopic) return res.status(400).json({ message: "topic is required" });
        
        const qc = Math.max(1, Math.min(Number(questionCount) || 10, 100));
        const dur = Math.max(30, Math.min(Number(durationSeconds) || 300, 60 * 60));

        // fetch questions (only human made) and validate if its enough
        const candidates = await Question.find({ course: courseId, createdByType: "human" }).lean();
        if (candidates.length < qc) {
            return res.status(422).json({
                message: "Not enough HUMAN questions available",
                required: qc,
                found: candidates.length,
            });
        }

        // get generated questions from gemini service
        const generated = await generateQuizQuestions(cleanTopic, qc, candidates);
        
        // Detect existing questions (to prevent duplicates)
        const existingQuestions = await Question.find(
            { course: courseId },
            { question: 1 }
        ).lean();
        const existingSet = new Set(existingQuestions.map(q => normalizeText(q.question)));
        
        // Save AI questions after filtering duplicates
        const aiDocs = [];
        for (const q of generated.questions || []) {
            const normalized = normalizeText(q.question);
            if (!normalized) continue;
            if (existingSet.has(normalized)) continue;

            existingSet.add(normalized); // <-- prevents within-batch duplicates too

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
        
        const saved = await Question.insertMany(aiDocs.slice(0, qc), { ordered: true });

        // Create Quiz that stores IDs
        const quiz = await Quiz.create({
            course: courseId,
            topic: cleanTopic,
            questionCount: qc,
            durationSeconds: dur,
            questions: saved,
            meta: generated.meta,
          });
        return res.status(201).json(quiz);
    } 
    catch (err) {
        return res.status(500).json({ message: `Server error creating quiz: ${err.message}` });
    }
});

// Get latest quiz for a course (or 404 if none)
router.get("/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(courseId)) return res.status(400).json({ message: "Invalid courseId" });
  
      // latest by createdAt
      const quiz = await Quiz.findOne({ course: courseId }).sort({ createdAt: -1 }).lean();
      if (!quiz) return res.status(404).json({ message: "No quiz found for this course" });
      
      return res.status(200).json(quiz);
    } catch (err) {
      return res.status(500).json({ message: `Server error fetching quiz: ${err.message}` });
    }
});

// Edit quiz details (topic, questions, duration, etc.)
router.patch("/quizzes/:quizId", (req, res) => {
  // TODO later
});

// Get the quiz by courseId
router.get("/courses/:courseId/quizzes/active", (req, res) => {

});

// Get quiz by quizId (optionally hide correct answers)
router.get("/quizzes/:quizId", (req, res) => {

});

// Submit a quiz attempt (answers + score)
router.post("/quizzes/:quizId/attempts", (req, res) => {

});

// Get quiz statistics (avg score, attempts count, pass rate)
router.get("/quizzes/:quizId/stats", (req, res) => {

});

// Get current user's attempt history for a quiz
router.get("/quizzes/:quizId/my-attempts", (req, res) => {

}); 

module.exports = router;