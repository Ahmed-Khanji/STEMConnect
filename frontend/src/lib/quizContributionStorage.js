// Same as default quiz size / minimum human pool for POST /api/quiz/:courseId.
export const MIN_HUMAN_QUESTIONS_FOR_QUIZ = 5;

// After this many of the user's own questions, if the pool is still under the min, show the "need others" flow.
export const USER_CONTRIBUTION_THRESHOLD = 3;

// Key to track the number of questions the user has contributed to a course.
function contribCountKey(userId, courseId) {
  return `quiz_user_contrib_${userId}_${courseId}`;
}

// Key to indicate that the user has already shown the "need others" flow.
function needOthersKey(userId, courseId) {
  return `quiz_need_others_${userId}_${courseId}`;
}

// Get the number of questions the user has contributed to a course.
export function getUserContribCount(userId, courseId) {
  if (!userId || !courseId) return 0;
  const v = localStorage.getItem(contribCountKey(userId, courseId));
  return Math.max(0, parseInt(v || "0", 10) || 0);
}

// Increment the number of questions the user has contributed to a course.
export function bumpUserContribCount(userId, courseId) {
  if (!userId || !courseId) return 0;
  const next = getUserContribCount(userId, courseId) + 1;
  localStorage.setItem(contribCountKey(userId, courseId), String(next));
  return next;
}

// Set the flag to indicate that the user has already shown the "need others" flow.
export function setNeedMoreFromOthers(userId, courseId) {
  if (!userId || !courseId) return;
  localStorage.setItem(needOthersKey(userId, courseId), "1");
}

// Check if the user should show the "need others" flow.
export function shouldShowNeedMoreFromOthers(userId, courseId) {
  if (!userId || !courseId) return false;
  return localStorage.getItem(needOthersKey(userId, courseId)) === "1";
}

// Clear the quiz contribution state for a user and course.
export function clearQuizContributionState(userId, courseId) {
  if (!userId || !courseId) return;
  localStorage.removeItem(contribCountKey(userId, courseId));
  localStorage.removeItem(needOthersKey(userId, courseId));
}
