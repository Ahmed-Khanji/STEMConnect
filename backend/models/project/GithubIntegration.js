const mongoose = require("mongoose");

const githubIntegrationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
      index: true,
    },
    repoFullName: { type: String, required: true, trim: true }, // e.g. org/repo
    repoUrl: { type: String, required: true, trim: true },
    connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    accessToken: {
      type: String,
      required: true,
      select: false, // omit from queries unless explicitly selected
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GithubIntegration", githubIntegrationSchema);
