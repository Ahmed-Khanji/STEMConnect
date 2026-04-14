const mongoose = require("mongoose");

const kanbanTaskSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    status: {
      type: String,
      enum: ["todo", "in_progress", "done"],
      default: "todo",
      index: true,
    },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

kanbanTaskSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model("KanbanTask", kanbanTaskSchema);
