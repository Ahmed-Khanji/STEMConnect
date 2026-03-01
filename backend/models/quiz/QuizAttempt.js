const mongoose = require("mongoose");

const attemptAnswerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true, index: true },
    selectedIndex: { type: Number, min: 0, max: 3 }, // MCQ
    textAnswer: { type: String, trim: true }, // Short answer
    correct: { type: Boolean, required: true, default: false, index: true },
  },
  { _id: false } // keep answers lean (no extra _id per answer)
);

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    score: { type: Number, default: 0, min: 0 }, // number of correct answers
    total: { type: Number, required: true, min: 1 }, // number of questions
    timeTakenSeconds: { type: Number, default: 0, min: 0 },
    startedAt: { type: Date, required: true, default: Date.now, index: true },
    completedAt: { type: Date, index: true },
    answers: [attemptAnswerSchema],
  },
  { timestamps: true }
);

// Give me the latest attempt of THIS user for THIS quiz
quizAttemptSchema.index({ user: 1, quiz: 1, startedAt: -1 });
// Show me recent attempts for a quiz in a course
quizAttemptSchema.index({ course: 1, quiz: 1, startedAt: -1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
