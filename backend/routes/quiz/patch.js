const { Quiz } = require("../../models/quiz");

function registerPatchRoutes(router) {
  // Edit quiz details (questions, duration, etc.)
  router.patch("/quizzes/:quizId", (req, res) => {
    // TODO later
  });
}

module.exports = registerPatchRoutes;
