const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, trim: true, index: true },
    question: { type: String, required: true, trim: true },
    type: { type: String, enum: ["mcq", "short"], required: true, index: true },
    explanation: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    createdByType: { type: String, enum: ["human", "ai"], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", 
      required:  function () {
        return this.createdByType === "human";
      }
    },
    // ===== MCQ fields =====
    options: {
      type: [String],
      validate: {
        validator: function (v) {
          // if not mcq then ignore, if it is then options must be an array of len 4
          return this.type !== "mcq" || (Array.isArray(v) && v.length === 4);
        },
        message: "MCQ questions must have exactly 4 options", // error message
      },
    },
    correctIndex: {
      type: Number,
      min: 0,
      max: 3,
      validate: {
        validator: function (v) {
          // if not mcq then ignore, then correctIndex must exist (must not equal undefined)
          return this.type !== "mcq" || v !== undefined;
        },
        message: "MCQ questions must have a correctIndex (0–3)",
      },
    },

    // ===== Short-answer fields =====
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed, // String or [String]
      validate: {
        validator: function (v) {
          return this.type !== "short" || v !== undefined;
        },
        message: "Short-answer questions must have a correctAnswer",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
