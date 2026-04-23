const mongoose = require("mongoose");
const Project = require("../../models/project/Project");
const JoinRequest = require("../../models/project/JoinRequest");
const KanbanTask = require("../../models/project/KanbanTask");
const { authenticateToken } = require("../auth/authRoutes");
const {
  assertProjectMember,
  assertProjectOwner,
  KANBAN_TASK_STATUSES,
  userIsOnProject,
  withResolvedImageOnProject,
} = require("../../utils/projectUtils");

function registerPatchRoutes(router) {
  // accept or decline a join request
  router.patch("/:id/join-requests/:reqId", authenticateToken, async (req, res) => {
    try {
      const { id, reqId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reqId)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      // check if user is the owner and validate the body status (either accepted or declined)
      await assertProjectOwner(id, req.user.userId);
      const status = req.body?.status != null ? String(req.body.status).trim() : "";
      if (!["accepted", "declined"].includes(status)) {
        return res.status(400).json({ message: "status must be accepted or declined" });
      }

      // update the join request status
      const joinRequest = await JoinRequest.findOneAndUpdate(
        { _id: reqId, projectId: id, status: "pending" },
        { $set: { status } },
        { new: true } // return the updated document (false return the document before the update)
      );
      if (!joinRequest) {
        const existing = await JoinRequest.findOne({ _id: reqId, projectId: id });
        if (!existing) return res.status(404).json({ message: "Join request not found" });
        return res.status(400).json({ message: "Join request is not pending" });
      }

      // if the join request is accepted, add the user to the project
      if (status === "accepted") {
        const project = await Project.findById(id).select("ownerId members");
        if (!project) return res.status(404).json({ message: "Project not found" });
        if (!userIsOnProject(project, joinRequest.userId)) {
          project.members.push({
            userId: joinRequest.userId,
            role: String(joinRequest.appliedRole || "").trim(),
            joinedAt: new Date(),
          });
          await project.save();
        }
      }

      return res.json({ joinRequest });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to update join request" });
    }
  });

  // transfer ownership to a new owner
  router.patch("/:id/transfer-ownership", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid project id" });
      }

      // check if user is the owner and validate the body newOwnerId (must be a valid user id)
      await assertProjectOwner(id, req.user.userId);
      const newOwnerId = req.body?.newOwnerId;
      if (!newOwnerId || !mongoose.Types.ObjectId.isValid(newOwnerId)) {
        return res.status(400).json({ message: "newOwnerId is required and must be valid" });
      }
      if (String(newOwnerId) === String(req.user.userId)) {
        return res.status(400).json({ message: "Already the owner" });
      }

      // check if the new owner is an existing member
      const project = await Project.findById(id).select("ownerId members");
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!userIsOnProject(project, newOwnerId)) {
        return res.status(400).json({ message: "New owner must be an existing member" });
      }

      // update the project owner and members
      project.ownerId = newOwnerId;
      for (const m of project.members) {
        if (String(m.userId) === String(newOwnerId)) m.role = "owner";
        else if (String(m.userId) === String(req.user.userId)) m.role = "";
      }
      await project.save();
      const populated = await Project.findById(id)
      .populate("ownerId", "name email")
      .populate("members.userId", "name email")
      .lean();
      if (!populated) return res.status(404).json({ message: "Project not found" });
      const out = await withResolvedImageOnProject(populated);

      return res.json({ project: out });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to transfer ownership" });
    }
  });

  // update a task
  router.patch("/:id/tasks/:taskId", authenticateToken, async (req, res) => {
    try {
      const { id, taskId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: "Invalid id" });
      }
      await assertProjectMember(id, req.user.userId);

      // check if the task exists and belongs to the project
      const task = await KanbanTask.findOne({ _id: taskId, projectId: id });
      if (!task) return res.status(404).json({ message: "Task not found" });

      // validate the body and update the task
      const { title, assigneeId, status, dueDate } = req.body || {};
      if (title !== undefined) {
        const t = String(title).trim();
        task.title = t;
      }
      if (status !== undefined) {
        const s = String(status);
        if (!KANBAN_TASK_STATUSES.has(s)) return res.status(400).json({ message: "Invalid task status" });
        task.status = s;
      }
      if (assigneeId !== undefined) {
        if (assigneeId === null || assigneeId === "") task.assigneeId = null;
        else {
          if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
            return res.status(400).json({ message: "Invalid assigneeId" });
          }
          await assertProjectMember(id, assigneeId);
          task.assigneeId = assigneeId;
        }
      }
      if (dueDate !== undefined) {
        if (dueDate === null || dueDate === "") task.dueDate = null;
        else {
          const d = new Date(dueDate);
          if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Invalid dueDate" });
          task.dueDate = d;
        }
      }

      await task.save();
      const populated = await KanbanTask.findById(task._id).populate("assigneeId", "name email");
      return res.json({ task: populated });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to update task" });
    }
  });
}

module.exports = registerPatchRoutes;
