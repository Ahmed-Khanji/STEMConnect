const mongoose = require("mongoose");
const Project = require("../../models/project/Project");
const KanbanTask = require("../../models/project/KanbanTask");
const GithubIntegration = require("../../models/project/GithubIntegration");
const JoinRequest = require("../../models/project/JoinRequest");
const Message = require("../../models/Message");
const { authenticateToken } = require("../auth/authRoutes");
const { assertProjectMember, assertProjectOwner } = require("../../utils/projectUtils");

function registerDeleteRoutes(router) {
  // leave a project
  router.delete("/:id/leave", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid project id" });
      }

      const project = await Project.findById(id).select("ownerId members");
      if (!project) return res.status(404).json({ message: "Project not found" });

      // check if user is the owner (must transfer ownership first)
      const userId = req.user.userId;
      if (String(project.ownerId) === String(userId)) {
        return res.status(400).json({ message: "Owner must transfer ownership before leaving" });
      }

      // check if user is a member and remove them from the project
      await assertProjectMember(id, userId);
      await Project.updateOne({ _id: id }, { $pull: { members: { userId: userId } } });

      return res.status(204).send();
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to leave project" });
    }
  });

  // delete a task
  router.delete("/:id/tasks/:taskId", authenticateToken, async (req, res) => {
    try {
      const { id, taskId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      // check if user is a member and delete the task
      await assertProjectMember(id, req.user.userId);
      const result = await KanbanTask.deleteOne({ _id: taskId, projectId: id });
      if (result.deletedCount === 0) return res.status(404).json({ message: "Task not found" });

      return res.status(204).send();
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to delete task" });
    }
  });

  // unlink a GitHub repo
  router.delete("/:id/github", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid project id" });
      }

      // check if user is the owner and unlink the GitHub repo
      await assertProjectOwner(id, req.user.userId);
      const result = await GithubIntegration.deleteOne({ projectId: id });
      if (result.deletedCount === 0) return res.status(404).json({ message: "No GitHub link for this project" });

      return res.status(204).send();
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to unlink GitHub repo" });
    }
  });

  // delete a project
  router.delete("/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid project id" });
      }

      // check if user is the owner and delete the project
      await assertProjectOwner(id, req.user.userId);
      const result = await Project.deleteOne({ _id: id });
      if (result.deletedCount === 0) return res.status(404).json({ message: "Project not found" });

      // cascade delete project-bound data
      await Promise.all([
        KanbanTask.deleteMany({ projectId: id }),
        GithubIntegration.deleteMany({ projectId: id }),
        JoinRequest.deleteMany({ projectId: id }),
        Message.deleteMany({ projectId: id }),
      ]);

      return res.status(204).send();
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to delete project" });
    }
  });
}

module.exports = registerDeleteRoutes;
