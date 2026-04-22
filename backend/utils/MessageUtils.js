const { assertCourseAccess } = require("./CourseUtils");
const { assertProjectMember } = require("./projectUtils");

// Safe last path segment for S3 object keys (no slashes, limited charset).
function sanitizeFilename(originalName) {
  const base = String(originalName || "file").split(/[/\\]/).pop().slice(0, 120);
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned || "file";
}

// Validates membership; returns course or project id plus the S3 key prefix for that workspace.
async function scopeForUser(userId, courseId, projectId) {
  const hasCourseId = Boolean(courseId);
  const hasProjectId = Boolean(projectId);
  if (hasCourseId === hasProjectId) {
    const err = new Error("Send exactly one of courseId or projectId");
    err.status = 400;
    throw err;
  }
  if (hasCourseId) {
    await assertCourseAccess(courseId, userId);
    return { kind: "course", courseId, prefix: `courses/${courseId}/` };
  }
  await assertProjectMember(projectId, userId);
  return { kind: "project", projectId, prefix: `projects/${projectId}/` };
}

module.exports = { sanitizeFilename, scopeForUser };
