const mongoose = require("mongoose");
const Project = require("../../models/project/Project");
const KanbanTask = require("../../models/project/KanbanTask");
const GithubIntegration = require("../../models/project/GithubIntegration");
const Message = require("../../models/Message");
const { authenticateToken } = require("../auth/authRoutes");
const {
    assertProjectMember,
    buildProjectListFilter,
    fetchGithubRepoSummary,
    withResolvedImageOnProject,
    withResolvedImageOnProjects,
} = require("../../utils/projectUtils");

function registerGetRoutes(router) {
    // load workspace (members only)
    router.get("/:id/workspace", authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            await assertProjectMember(id, req.user.userId);

            const project = await Project.findById(id)
            .populate("ownerId members.userId", "name email")
            .lean();
            if (!project) return res.status(404).json({ message: "Project not found" });

            const out = await withResolvedImageOnProject(project);
            res.json({ project: out });
        } catch (err) {
            res.status(err.status || 500).json({ message: err.message || "Failed to load workspace" });
        }
    });

    // load GitHub repository summary (members only)
    router.get("/:id/github", authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            await assertProjectMember(id, req.user.userId);

            const integration = await GithubIntegration.findOne({ projectId: id }).select("+accessToken").lean();
            if (!integration) return res.json({ linked: false });

            const summary = await fetchGithubRepoSummary(integration.repoFullName, integration.accessToken);
            res.json({ linked: true, ...summary });
        } catch (err) {
            res.status(502).json({ message: err.message || "GitHub request failed" });
        }
    });

    // load messages for the chat (filter by limit and before date)
    router.get("/:id/messages", authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            await assertProjectMember(id, req.user.userId);

            const limit = Math.min(parseInt(req.query.limit || "40", 10), 100);
            const before = req.query.before ? new Date(req.query.before) : null;
            const filter = { projectId: id };
            if (before && !Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };

            const messages = await Message.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("sender", "name email");

            res.json({ messages });
        } catch (err) {
            res.status(err.status || 500).json({ message: err.message || "Failed to load messages" });
        }
    });

    // load kanban tasks (members only)
    router.get("/:id/tasks", authenticateToken, async (req, res) => {
        try {
            const { id } = req.params;
            await assertProjectMember(id, req.user.userId);

            const tasks = await KanbanTask.find({ projectId: id })
            .sort({ createdAt: 1 })
            .populate("assigneeId", "name email");

            res.json({ tasks });
        } catch (err) {
            res.status(err.status || 500).json({ message: err.message || "Failed to load tasks" });
        }
    });

    // load project details — catch-all :id, must stay before GET /
    router.get("/:id", async (req, res) => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid project id" });

            const project = await Project.findById(id).populate("ownerId", "name email").lean();
            if (!project) return res.status(404).json({ message: "Project not found" });

            const out = await withResolvedImageOnProject(project);
            res.json({ project: out });
        } catch (err) {
            res.status(500).json({ message: err.message || "Failed to load project" });
        }
    });

    // list all projects with optional filters — kept last (broad route)
    router.get("/", async (req, res) => {
        try {
            // query by title, description, status, rolesNeeded, techstack
            const filter = buildProjectListFilter(req.query);

            const projects = await Project.find(filter)
            .sort({ createdAt: -1 })
            .populate("ownerId", "name email")
            .lean();

            const resolved = await withResolvedImageOnProjects(projects);
            res.json({ projects: resolved });
        } catch (err) {
            res.status(500).json({ message: err.message || "Failed to list projects" });
        }
    });
}

module.exports = registerGetRoutes;
