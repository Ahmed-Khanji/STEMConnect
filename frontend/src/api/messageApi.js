import client, { handleError } from "./client";

// GET /api/messages/:courseId?limit=40&before=<ISO>
export async function getMessages(courseId, { limit = 40, before } = {}) {
    try {
      const params = { limit };
      if (before) params.before = before;
      const res = await client.get(`/api/messages/${courseId}`, { params });
      return res.data; // { messages: [...] }
    } catch (err) {
      handleError(err);
    }
}

// POST /api/messages/:courseId
export async function sendMessage(courseId, payload) {
    try {
      const res = await client.post(`/api/messages/${courseId}`, payload);
      return res.data; // { message: {...} }
    } catch (err) {
      handleError(err);
    }
}