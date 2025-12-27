const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
      color: { type: String, default: "#8B5CF6" }, // violet-500
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      status: { type: String, enum: ["unverified", "verified"], default: "unverified" },
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users enrolled in the course
}, { timestamps: true });
  
  module.exports = mongoose.model("Course", courseSchema);