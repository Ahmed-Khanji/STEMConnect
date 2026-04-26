import client, { handleError } from "./client";

// GET /api/messages/course/:courseId?limit=40&before=<ISO>
export async function getMessages(courseId, { limit = 40, before } = {}) {
    try {
      const params = { limit };
      if (before) params.before = before;
      const res = await client.get(`/api/messages/course/${courseId}`, { params });
      return res.data; // { messages: [...] }
    } catch (err) {
      handleError(err);
    }
}

// POST /api/messages/course/:courseId
export async function sendMessage(courseId, payload) {
    try {
      const res = await client.post(`/api/messages/course/${courseId}`, payload);
      return res.data; // { message: {...} }
    } catch (err) {
      handleError(err);
    }
}