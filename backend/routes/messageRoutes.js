const express = require("express");
const Message = require("../models/Message");
const { authenticateToken } = require("./auth/authRoutes");
const { assertCourseAccess } = require("../utils/CourseUtils");

const router = express.Router();

// GET /api/messages/:courseId?limit=40&before=<ISO date>: load latest messages in a course
router.get("/:courseId", authenticateToken, async (req, res) => {
    try {
      const { courseId } = req.params;
      const userId = req.user.userId;
      await assertCourseAccess(courseId, userId);
  
      const limit = Math.min(parseInt(req.query.limit || "40", 10), 100);
      const before = req.query.before ? new Date(req.query.before) : null;
      const filter = { course: courseId };
      if (before && !Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };
      
      const messages = await Message.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("sender", "name email"); // populate will check the ref User and populate according to the id
  
      res.json({ messages });
    } catch (err) {
      res.status(err.status || 500).json({ message: err.message || "Failed to load messages" });
    }
});

module.exports = router;
