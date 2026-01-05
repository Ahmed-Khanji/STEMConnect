const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    content: {
      type: String,
      trim: true,
      maxlength: 2000,
      required: function () {
        return this.type === "text";
      },
    },
    attachments: [
      {
        kind: { type: String, enum: ["image", "file"], required: true },
        url: { type: String, required: true },
        name: { type: String },
        size: { type: Number },
        mime: { type: String }, // MIME type (application/pdf, image/jpeg, etc.)
      },
    ],
  },
  { timestamps: true }
);

// compound index for fast "load latest messages in a course"
messageSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
