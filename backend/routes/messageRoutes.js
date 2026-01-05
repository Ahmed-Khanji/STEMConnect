const express = require("express");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Message = require("../models/Message");
const { authenticateToken } = require("./authRoutes");

const router = express.Router();

/* ---------- Helpers ---------- */
async function assertCourseAccess(courseId, userId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const err = new Error("Invalid courseId");
      err.status = 400;
      throw err;
    }
  
    const course = await Course.findById(courseId).select("users");
    if (!course) {
      const err = new Error("Course not found");
      err.status = 404;
      throw err;
    }
  
    const isEnrolled = Array.isArray(course.users) && course.users.some((u) => String(u) === String(userId));
    if (!isEnrolled) {
      const err = new Error("Not allowed in this course");
      err.status = 403;
      throw err;
    }
  
    return course;
}

// GET /api/messages/:courseId?limit=40&before=<ISO date>
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

// POST /api/messages/:courseId, body: { type?: "text"|"image"|"file", content?: string, attachments?: [] }
router.post("/:courseId", authenticateToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.userId;
        await assertCourseAccess(courseId, userId);
    
        const { type = "text", content = "", attachments = [] } = req.body;
        if (type === "text" && !String(content).trim()) {
            return res.status(400).json({ error: "Message content is required" });
        }
    
        const created = await Message.create({
            course: courseId,
            sender: userId,
            type,
            content: String(content),
            attachments: Array.isArray(attachments) ? attachments : [],
        });
        // populate sender for frontend display
        const populated = await Message.findById(created._id).populate("sender", "name email");
    
        // emit via socket (no need to refresh/polling=rechecking server for new message)
        const io = req.app.get("io");
        if (io) io.to(`course:${courseId}`).emit("newMessage", populated);
    
        res.status(201).json({ message: populated });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || "Failed to send message" });
    }
});

module.exports = router;
