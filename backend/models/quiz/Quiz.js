const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    questionCount: { type: Number, default: 5, min: 1, max: 100 },
    durationSeconds: { type: Number, default: 300, min: 30, max: 60 * 60 },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    meta: { type: mongoose.Schema.Types.Mixed, default: undefined } // metadata from AI service
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
