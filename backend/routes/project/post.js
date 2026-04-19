const mongoose = require("mongoose");
const Project = require("../../models/project/Project");
const JoinRequest = require("../../models/project/JoinRequest");
const KanbanTask = require("../../models/project/KanbanTask");
const GithubIntegration = require("../../models/project/GithubIntegration");
const { authenticateToken } = require("../auth/authRoutes");
const {
  assertProjectMember,
  assertProjectOwner,
  COMMITMENTS,
  JOINABLE_PROJECT_STATUSES,
  KANBAN_TASK_STATUSES,
  PROJECT_STATUSES,
  userIsOnProject,
  verifyGithubRepoAccess,
} = require("../../utils/projectUtils");

function registerPostRoutes(router) {
  // create project (auth)
  router.post("/", authenticateToken, async (req, res) => {
    try {
      const { title, description, techstack, rolesNeeded, commitment, status } = req.body;
      if (!title || !String(title).trim()) {
        return res.status(400).json({ message: "Title is required" });
      }

      if (rolesNeeded.length > 4) return res.status(400).json({ message: "At most 4 roles needed" });
      const commit = commitment && COMMITMENTS.has(String(commitment)) ? commitment : "side_project";
      const st = status && PROJECT_STATUSES.has(String(status)) ? status : "recruiting";
      
      const project = await Project.create({
        title: String(title).trim(),
        description: description != null ? String(description).trim() : "",
        techstack: techstack,
        rolesNeeded: rolesNeeded,
        commitment: commit,
        status: st,
        ownerId: req.user.userId,
        members: [{ userId: req.user.userId, role: "owner", joinedAt: new Date() }],
      });
      const populated = await Project.findById(project._id).populate("ownerId", "name email");
      
      return res.status(201).json({ project: populated });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to create project" });
    }
  });

  // send join request (auth)
  router.post("/:id/join-requests", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid project id" });
      }
      // check if project exists and is accepting join requests
      const project = await Project.findById(id).select("ownerId members status rolesNeeded");
      if (!project) return res.status(404).json({ message: "Project not found" });
      if (!JOINABLE_PROJECT_STATUSES.has(project.status)) {
        return res.status(400).json({ message: "Project is not accepting join requests" });
      }
      // check if user is the owner/member of the project
      const userId = req.user.userId;
      if (String(project.ownerId) === String(userId)) {
        return res.status(400).json({ message: "Owner cannot join-request own project" });
      }
      if (userIsOnProject(project, userId)) {
        return res.status(400).json({ message: "Already a member" });
      }
      const message = req.body?.message != null ? String(req.body.message).trim() : "";
      const appliedRole =
        req.body?.appliedRole != null ? String(req.body.appliedRole).trim() : "";
      if (!appliedRole) {
        return res.status(400).json({ message: "appliedRole is required" });
      }
      if (project.rolesNeeded.length > 0 && !project.rolesNeeded.includes(appliedRole)) {
        return res.status(400).json({ message: "appliedRole must be one of this project's rolesNeeded" });
      }

      // check if join request already exists
      const existing = await JoinRequest.findOne({ projectId: id, userId: userId, status: "pending" });
      if (existing) return res.status(409).json({ message: "Join request already pending" });

      const joinRequest = await JoinRequest.create({
        projectId: id,
        userId: userId,
        appliedRole,
        message,
        status: "pending",
      });

      return res.status(201).json({ joinRequest });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to create join request" });
    }
  });

  // create kanban task (auth, members only)
  router.post("/:id/tasks", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      await assertProjectMember(id, req.user.userId);

      // Validations
      const { title, assigneeId, status, dueDate } = req.body;
      if (!title || !String(title).trim()) {
        return res.status(400).json({ message: "Title is required" });
      }
      if (assigneeId) await assertProjectMember(id, assigneeId);
      const taskStatus = status && KANBAN_TASK_STATUSES.has(String(status)) ? status : "todo";
      let due = null;
      if (dueDate != null && String(dueDate).trim()) {
        const d = new Date(dueDate);
        if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Invalid dueDate" });
        due = d;
      }

      const task = await KanbanTask.create({
        projectId: id,
        title: String(title).trim(),
        assigneeId: assigneeId || null,
        status: taskStatus,
        dueDate: due,
      });
      const populated = await KanbanTask.findById(task._id).populate("assigneeId", "name email");

      return res.status(201).json({ task: populated });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to create task" });
    }
  });

  // link GitHub repo with a project (auth, owner only)
  router.post("/:id/github", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      await assertProjectOwner(id, req.user.userId);
      
      // Validations
      const { repoFullName, repoUrl, accessToken } = req.body || {};
      const full = repoFullName != null ? String(repoFullName).trim() : "";
      const url = repoUrl != null ? String(repoUrl).trim() : "";
      const token = accessToken != null ? String(accessToken).trim() : "";
      if (!full || !url || !token) {
        return res.status(400).json({ message: "repoFullName, repoUrl, and accessToken are required" });
      }
      // check if repoFullName is valid: owner/repo-name
      if (!/^[\w.-]+\/[\w.-]+$/.test(full)) {
        return res.status(400).json({ message: "repoFullName must look like owner/repo" });
      }
      await verifyGithubRepoAccess(full, token);

      const existed = await GithubIntegration.exists({ projectId: id });
      const doc = await GithubIntegration.findOneAndUpdate(
        { projectId: id },
        {
          projectId: id,
          repoFullName: full,
          repoUrl: url,
          connectedBy: req.user.userId,
          accessToken: token,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).select("-accessToken");

      return res.status(existed ? 200 : 201).json({ github: doc });
    } catch (err) {
      return res.status(err.status || 500).json({ message: err.message || "Failed to link GitHub repo" });
    }
  });
}

module.exports = registerPostRoutes;
