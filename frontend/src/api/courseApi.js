import client, { handleError } from "./client";

export async function createCourse(payload) {
  // payload = { name, code, color }
  try {
    const res = await client.post("/api/courses", payload);
    return res.data.course; // return the course itself
  } catch (err) {
    handleError(err);
  }
}

export async function getAllCourses(q = "") {
    try {
      const res = await client.get("/api/courses", {
        params: q ? { q } : {},
      });
      return res.data.courses;
    } catch (err) {
      handleError(err);
    }
}

export async function getMyCourses() {
    try {
      const res = await client.get("/api/courses/mycourses");
      return res.data.courses;
    } catch (err) {
      handleError(err);
    }
}

export async function joinCourseByCode(code) {
  try {
    const res = await client.post("/api/courses/join-by-code", {
      code,
    });
    return res.data; // { message, courseId }
  } catch (err) {
    handleError(err);
  }
}

export async function leaveCourse(courseId) {
  try {
    const res = await client.post(`/api/courses/${courseId}/leave`);
    return res.data; // { message: "Left course" }
  } catch (err) {
    handleError(err);
  }
}

// POST /api/courses/:id/read
export async function markCourseRead(courseId) {
  try {
    const res = await client.post(`/api/courses/${courseId}/read`);
    return res.data;
  } catch (err) {
    handleError(err);
  }
}

// GET /api/courses/unread-counts
export async function getUnreadCounts() {
  try {
    const res = await client.get(`/api/courses/unread-counts`);
    return res.data; // { unreadCounts: { [courseId]: number } }
  } catch (err) {
    handleError(err);
  }
}