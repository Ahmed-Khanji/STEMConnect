import client, { handleError } from "./client";

// Create a new quiz for a course
export async function createQuiz(courseId, { topic, questionCount = 5, durationSeconds = 300 }) {
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

// Create a single human-contributed question for a course
export async function createQuestion(courseId, payload) {
  const res = await client.post(`/api/quiz/${courseId}/question`, payload);
  return res.data;
}

// Generate AI explanation for a question (backend calls Gemini)
export async function generateExplanation(payload) {
  const res = await client.post("/api/quiz/generate-explanation", payload);
  return res.data;
}