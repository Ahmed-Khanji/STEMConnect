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

// POST /api/messages/attachments/presign-upload
export async function presignUpload({ messageId, contentType, fileName, courseId }) {
  try {
    const res = await client.post("/api/messages/attachments/presign-upload", {
      messageId,
      contentType,
      fileName,
      courseId,
    });
    return res.data; // { putUrl, key, expiresIn }
  } catch (err) {
    handleError(err);
  }
}

// POST /api/messages/attachments/presign-download
export async function presignDownload({ messageId, attachmentIndex, courseId }) {
  try {
    const res = await client.post("/api/messages/attachments/presign-download", {
      messageId,
      attachmentIndex,
      courseId,
    });
    return res.data; // { getUrl, expiresIn }
  } catch (err) {
    handleError(err);
  }
}

// POST /api/messages/attachments/presign-delete
export async function presignDelete({ key, courseId }) {
  try {
    const res = await client.post("/api/messages/attachments/presign-delete", {
      key,
      courseId,
    });
    return res.data; // { deleteUrl, expiresIn }
  } catch (err) {
    handleError(err);
  }
}