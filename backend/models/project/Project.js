const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, trim: true, default: "" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true, index: true },
    techstack: [{ type: String, trim: true }],
    rolesNeeded: [{ type: String, trim: true }],
    commitment: {
      type: String,
      enum: ["hackathon", "side_project", "startup"],
      default: "side_project",
    },
    status: {
      type: String,
      enum: ["recruiting", "in_progress", "completed", "archived"],
      default: "recruiting",
      index: true,
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: [memberSchema],
    engagement: {
      likes: { type: Number, default: 0, min: 0 },
      views: { type: Number, default: 0, min: 0 },
    },
    imageUrl: { type: String, default: "", trim: true, maxlength: 2048 },
  },
  { timestamps: true }
);

projectSchema.index({ createdAt: -1 });
projectSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
