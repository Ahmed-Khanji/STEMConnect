const mongoose = require("mongoose");
const Course = require("../models/Course");

const httpErr = (status, msg) => Object.assign(new Error(msg), { status });

async function assertCourseAccess(courseId, userId) {
  if (!mongoose.Types.ObjectId.isValid(courseId)) throw httpErr(400, "Invalid courseId");
  const course = await Course.findById(courseId).select("users");
  if (!course) throw httpErr(404, "Course not found");
  if (!course.users?.some((u) => String(u) === String(userId)))
    throw httpErr(403, "Not allowed in this course");
  return course;
}

function parseOptionalDate(value) {
  if (value == null || value === "") return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// Returns { ok: true, ...fields } or { ok: false, status, message }
function parseQuizAttemptBody(quiz, body) {
  const fail = (status, message) => ({ ok: false, status, message });
  const qLen = quiz.questions?.length;
  const expected = qLen > 0 ? qLen : Number(quiz.questionCount) || 0;
  if (expected < 1) return fail(422, "Quiz has no questions configured");

  const t = Number(body.total);
  if (!Number.isInteger(t) || t < 1 || t !== expected)
    return fail(400, `total must be a positive integer equal to quiz size (${expected})`);

  const s = Number(body.score);
  if (!Number.isInteger(s) || s < 0 || s > t)
    return fail(400, "score must be an integer from 0 through total");

  const secs = Number(body.timeTakenSeconds ?? 0);
  if (!Number.isInteger(secs) || secs < 0)
    return fail(400, "timeTakenSeconds must be a non-negative integer");

  const list = body.answers == null ? [] : Array.isArray(body.answers) ? body.answers : null;
  if (list === null) return fail(400, "answers must be an array");

  const allowed = new Set((quiz.questions || []).map((id) => String(id)));
  const seen = new Set();
  const answers = [];
  for (const a of list) {
    const qid = a?.question;
    if (!mongoose.Types.ObjectId.isValid(String(qid))) return fail(400, "Each answer needs a valid question id");
    const key = String(qid);
    if (seen.has(key)) return fail(400, "Duplicate question in answers");
    seen.add(key);
    if (allowed.size && !allowed.has(key))
      return fail(400, "Answer references a question not on this quiz");
    if (a.selectedIndex != null) {
      const idx = Number(a.selectedIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx > 3)
        return fail(400, "selectedIndex must be 0–3 when provided");
    }
    answers.push({
      question: qid,
      selectedIndex: typeof a.selectedIndex === "number" ? a.selectedIndex : undefined,
      textAnswer: a.textAnswer != null ? String(a.textAnswer).trim() : undefined,
      correct: Boolean(a.correct),
    });
  }

  const startedAt = parseOptionalDate(body.startedAt);
  if (body.startedAt != null && body.startedAt !== "" && startedAt === null) return fail(400, "Invalid startedAt");
  const completedAt = parseOptionalDate(body.completedAt);
  if (body.completedAt != null && body.completedAt !== "" && completedAt === null) return fail(400, "Invalid completedAt");

  return { ok: true, t, s, secs, answers, startedAt, completedAt };
}

function normalizeText(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

module.exports = {
  assertCourseAccess,
  parseOptionalDate,
  parseQuizAttemptBody,
  normalizeText,
};
