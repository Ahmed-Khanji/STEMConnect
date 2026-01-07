const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    topic: { type: String, trim: true, required: true, index: true },
    questionCount: { type: Number, default: 10, min: 1, max: 100 },
    durationSeconds: { type: Number, default: 300, min: 30, max: 60 * 60 },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
