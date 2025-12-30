import client from "./client";

function handleError(err) {
  const data = err?.response?.data;
  const msg = data?.error || data?.message || "Request failed";
  throw new Error(msg);
}

export async function createCourse(payload) {
  // payload = { name, code, color };
  try {
    const res = await client.post("/api/courses", payload);
    return res.data;
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