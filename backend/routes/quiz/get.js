const mongoose = require("mongoose");
const { Quiz, QuizAttempt, Question } = require("../../models/quiz");

function registerGetRoutes(router) {
  // Human-written question count for a course (must be before GET /:courseId)
  router.get("/:courseId/human-questions-count", async (req, res) => {
    try {
      const { courseId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid courseId" });
      }
      const count = await Question.countDocuments({
        course: courseId,
        createdByType: "human",
      });
      return res.status(200).json({ count });
    } catch (err) {
      return res.status(500).json({
        message: `Server error counting human questions: ${err.message}`,
      });
    }
  });

  // Get latest quiz for a course
  router.get("/:courseId", async (req, res) => {
    try {
      const { courseId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(courseId))
        return res.status(400).json({ message: "Invalid courseId" });

      const quiz = await Quiz.findOne({ course: courseId })
        .sort({ createdAt: -1 })
        .populate("questions")
        .lean();
      if (!quiz)
        return res.status(404).json({ message: "No quiz found for this course" });

      return res.status(200).json(quiz);
    } catch (err) {
      return res.status(500).json({
        message: `Server error fetching quiz: ${err.message}`,
      });
    }
  });

  // Get quiz by quizId
  router.get("/quizzes/:quizId", async (req, res) => {
    try {
      const { quizId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(quizId))
        return res.status(400).json({ message: "Invalid quizId" });

      const quiz = await Quiz.findById(quizId).lean();
      if (!quiz)
        return res.status(404).json({ message: "Quiz not found" });

      return res.status(200).json(quiz);
    } catch (err) {
      return res.status(500).json({
        message: `Server error fetching quiz: ${err.message}`,
      });
    }
  });

  // Get quiz statistics (all attempts for this quiz)
  router.get("/quizzes/:quizId/stats", async (req, res) => {
    try {
      const { quizId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(quizId))
        return res.status(400).json({ message: "Invalid quizId" });

      const quiz = await Quiz.findById(quizId).lean();
      if (!quiz)
        return res.status(404).json({ message: "Quiz not found" });

      // get all attempts for this quiz for all users
      const attempts = await QuizAttempt.find({ quiz: quizId })
        .sort({ startedAt: -1 })
        .lean();

      const attemptCount = attempts.length;
      const totalQuestions = quiz.questionCount || 0;
      
      const sumScore = attempts.reduce((acc, a) => acc + (a.score ?? 0), 0);
      const avgScorePercent = totalQuestions > 0 && attemptCount > 0 // between 0 and 100
          ? Math.round((sumScore / (attemptCount * totalQuestions)) * 100)
          : 0;
      
      const passingAttempts = attempts.filter(
        (a) => a.total > 0 && (a.score ?? 0) / a.total >= 0.6 // 60% pass rate
      );
      const passedUserIds = [...new Set(passingAttempts.map((a) => String(a.user)))];
      const passRate = attemptCount > 0 // between 0 and 100
          ? Math.round((passingAttempts.length / attemptCount) * 100) // percent of users who passed
          : 0;
      
      const sumTime = attempts.reduce(
        (acc, a) => acc + (a.timeTakenSeconds ?? 0),
      0); // total time taken for all attempts (in seconds)
      const avgTimeTakenSeconds = attemptCount > 0 ? Math.round(sumTime / attemptCount) : 0;

      return res.status(200).json({
        quizId,
        attempts,
        stats: {
          attemptCount,
          avgScorePercent,
          passedUserIds,
          passRate,
          avgTimeTakenSeconds,
        },
      });
    } catch (err) {
      return res.status(500).json({
        message: `Server error fetching quiz stats: ${err.message}`,
      });
    }
  });

  // Get current user's attempt history for a quiz
  router.get("/quizzes/:quizId/my-attempts", async (req, res) => {
    try {
      const userId = req.user.userId;
      const { quizId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(quizId))
        return res.status(400).json({ message: "Invalid quizId" });

      const attempts = await QuizAttempt.find({ quiz: quizId, user: userId })
        .sort({ startedAt: -1 })
        .lean();
      return res.status(200).json(attempts);
    } catch (err) {
      return res.status(500).json({ message: `Server error: ${err.message}` });
    }
  });
}

module.exports = registerGetRoutes;
