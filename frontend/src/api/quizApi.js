import client, { handleError } from "./client";

// Create a new quiz for a course
export async function createQuiz(courseId, { questionCount = 5, durationSeconds = 300 } = {}) {
    try {
      const res = await client.post(`/api/quiz/${courseId}`, {
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

// Count human-written questions for a course (from DB)
export async function getHumanQuestionCount(courseId) {
  const res = await client.get(`/api/quiz/${courseId}/human-questions-count`);
  return res.data;
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

// Class / aggregate stats for a quiz (attempt averages, etc.)
export async function getQuizStats(quizId) {
  const res = await client.get(`/api/quiz/quizzes/${quizId}/stats`);
  return res.data;
}

// Submit a completed quiz attempt for score tracking
export async function submitQuizAttempt(quizId, payload) {
  const res = await client.post(`/api/quiz/quizzes/${quizId}/attempts`, payload);
  return res.data;
}

// Get the current user's attempt(s) for a specific quiz
export async function getMyAttempts(quizId) {
  const res = await client.get(`/api/quiz/quizzes/${quizId}/my-attempts`);
  return res.data;
}