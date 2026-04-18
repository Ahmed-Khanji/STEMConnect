const mongoose = require("mongoose");
const Project = require("../models/project/Project");

const httpErr = (status, msg) => Object.assign(new Error(msg), { status });

async function assertProjectMember(projectId, userId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) throw httpErr(400, "Invalid project id");
  // check if project exists
  const project = await Project.findById(projectId).select("ownerId members");
  if (!project) throw httpErr(404, "Project not found");
  // check if user is a member of the project
  const uid = String(userId);
  if (String(project.ownerId) === uid) return project;
  const ok = project.members?.some((m) => String(m.userId) === uid);
  if (!ok) throw httpErr(403, "Not a project member");
  return project;
}

async function assertProjectOwner(projectId, userId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) throw httpErr(400, "Invalid project id");
  const project = await Project.findById(projectId).select("ownerId");
  if (!project) throw httpErr(404, "Project not found");
  if (String(project.ownerId) !== String(userId)) throw httpErr(403, "Owner only");
  return project;
}

function userIsOnProject(project, userId) {
  if (String(project.ownerId) === String(userId)) return true;
  return project.members?.some((m) => String(m.userId) === uid) ?? false;
}

async function verifyGithubRepoAccess(repoFullName, accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "STEMConnect",
  };
  const res = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers });
  if (!res.ok) {
    const t = await res.text();
    throw httpErr(400, t || `GitHub rejected repo (${res.status})`);
  }
}

function buildProjectListFilter(query) {
  const filter = {};
  const q = (query.q || "").trim();
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }
  if (query.status) filter.status = String(query.status);
  if (query.role) filter.rolesNeeded = String(query.role);
  if (query.tech) filter.techstack = String(query.tech);
  return filter;
}

async function fetchGithubRepoSummary(repoFullName, accessToken) {
  // fetch the repo summary from GitHub API
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "STEMConnect",
  };
  const base = `https://api.github.com/repos/${repoFullName}`;
  const [repoRes, commitsRes, pullsRes] = await Promise.all([
    fetch(base, { headers }),
    fetch(`${base}/commits?per_page=10`, { headers }),
    fetch(`${base}/pulls?state=open&per_page=10`, { headers }),
  ]);
  
  // check if the repo is valid
  if (!repoRes.ok) {
    const t = await repoRes.text();
    throw new Error(t || `GitHub repo error ${repoRes.status}`);
  }
  // jsonify the repo, commits, and pull requests
  const repo = await repoRes.json();
  const commits = commitsRes.ok ? await commitsRes.json() : [];
  const pullRequests = pullsRes.ok ? await pullsRes.json() : [];
  
  return {
    repo: {
      fullName: repo.full_name,
      htmlUrl: repo.html_url,
      description: repo.description,
      defaultBranch: repo.default_branch,
      updatedAt: repo.updated_at,
    },

    commits: Array.isArray(commits) ? commits.slice(0, 10).map((c) => ({
      sha: c.sha?.slice(0, 7), // short hash of the commit e.g. 1234567
      message: c.commit?.message,
      author: c.commit?.author?.name,
      date: c.commit?.author?.date,
      url: c.html_url,
    })) : [],

    pullRequests: Array.isArray(pullRequests) ? pullRequests.slice(0, 10).map((p) => ({
      number: p.number,
      title: p.title,
      state: p.state,
      user: p.user?.login,
      url: p.html_url,
      updatedAt: p.updated_at,
    })) : [],
  };
}

module.exports = {
  assertProjectMember,
  assertProjectOwner,
  buildProjectListFilter,
  fetchGithubRepoSummary,
  httpErr,
  userIsOnProject,
  verifyGithubRepoAccess,
};
