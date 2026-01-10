import client, { handleError } from "./client";

// Create a new quiz for a course
export async function createQuiz(courseId, { topic, questionCount = 10, durationSeconds = 300 }) {
    try {
      const res = await client.post(`/api/quiz/${courseId}`, {
        topic,
        questionCount,
        durationSeconds,
      });
      return res.data;
    } catch (err) {
      throw err
    }
}

// Get the latest quiz for a course
export async function getLatestQuiz(courseId) {
    try {
      const res = await client.get(`/api/quiz/${courseId}`);
      return res.data;
    } catch (err) {
      throw err
    }
}