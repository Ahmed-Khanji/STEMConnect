const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    message: { type: String, trim: true, default: "", maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

joinRequestSchema.index({ projectId: 1, userId: 1 });
joinRequestSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model("JoinRequest", joinRequestSchema);
