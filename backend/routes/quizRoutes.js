const express = require("express");
const mongoose = require("mongoose");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const QuizAttempt = require("../models/QuizAttempt");

const { authenticateToken } = require("./authRoutes");
const { generateQuizQuestions, validateQuestion } = require('../services/geminiService');

const router = express.Router();

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
router.post("/courses/:courseId/quizzes", async (req, res) => {
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
            return res.status(400).json({
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
        const aiDocs = generated.questions
            .filter(q => {
                const normalized = normalizeText(q.question);
                return !existingSet.has(normalized);
            })
            .map(q => ({
                ...q,
                course: courseId,
                createdByType: "ai",
            }));
            
        const saved = await Question.insertMany(aiDocs, { ordered: true });
        const savedIds = saved.map(d => d._id);

        // Create Quiz that stores IDs
        const quiz = await Quiz.create({
            course: courseId,
            topic: cleanTopic,
            questionCount: qc,
            durationSeconds: dur,
            questions: savedIds, // store ids
            meta: generated.meta,
          });
        return res.status(201).json(quiz);
    } 
    catch (err) {
        return res.status(500).json({ message: `Server error creating quiz: ${err.message}` });
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