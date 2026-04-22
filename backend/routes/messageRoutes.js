const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const { assertCourseAccess } = require("../utils/CourseUtils");
const { assertProjectMember } = require("../utils/projectUtils");
const { sanitizeFilename, scopeForUser } = require("../utils/MessageUtils");
const s3 = require("../services/s3");

const router = express.Router();
const PRESIGN_URL_EXPIRES_SECONDS = 900;

// presigned upload URL for attachments
router.post("/attachments/presign-upload", async (req, res) => {
  try {
    const userId = req.user.userId;
    const body = req.body || {};
    const attachmentScope = await scopeForUser(userId, body.courseId, body.projectId);
    
    // validate messageId and contentType
    const messageId = String(body.messageId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(messageId)) return res.status(400).json({ message: "Invalid messageId" });
    const contentType = String(body.contentType || "").trim();
    if (!contentType) return res.status(400).json({ message: "Missing contentType" });

    // check if message exists and belongs to the requested scope
    const existingMessage = await Message.findById(messageId).select("course project sender");
    if (existingMessage) {
      const messageBelongsToRequestedScope =
        attachmentScope.kind === "course"
          ? String(existingMessage.course) === String(attachmentScope.courseId)
          : String(existingMessage.project) === String(attachmentScope.projectId);
      if (!messageBelongsToRequestedScope) {
        return res.status(403).json({ message: "Message not in this scope" });
      }
      if (String(existingMessage.sender) !== String(userId)) return res.status(403).json({ message: "Forbidden" });
    }

    const relativeObjectKey = `${messageId}/${sanitizeFilename(body.fileName)}`;
    const s3ObjectKey =
      attachmentScope.kind === "course"
        ? `courses/${attachmentScope.courseId}/${relativeObjectKey}`
        : `projects/${attachmentScope.projectId}/${relativeObjectKey}`;

    const putUrl = await s3.presignedPutUrl(s3ObjectKey, contentType, PRESIGN_URL_EXPIRES_SECONDS);
    res.json({ putUrl, key: s3ObjectKey, expiresIn: PRESIGN_URL_EXPIRES_SECONDS });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "presign-upload failed" });
  }
});

// presigned download URL for attachments
router.post("/attachments/presign-download", async (req, res) => {
  try {
    const userId = req.user.userId;
    const body = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(body.messageId)) return res.status(400).json({ message: "Invalid messageId" });
    const attachmentIndex = parseInt(body.attachmentIndex, 10);
    if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
      return res.status(400).json({ message: "Invalid attachmentIndex" });
    }

    const message = await Message.findById(body.messageId).select("course project attachments");
    if (!message) return res.status(404).json({ message: "Not found" });
    const attachment = message.attachments?.[attachmentIndex];
    if (!attachment?.url) return res.status(404).json({ message: "Not found" });

    if (message.course) await assertCourseAccess(message.course, userId);
    else await assertProjectMember(message.project, userId);

    const getUrl = await s3.presignedGetUrl(attachment.url, PRESIGN_URL_EXPIRES_SECONDS);
    res.json({ getUrl, expiresIn: PRESIGN_URL_EXPIRES_SECONDS });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "presign-download failed" });
  }
});

// presigned delete URL for attachments
router.post("/attachments/presign-delete", async (req, res) => {
  try {
    const userId = req.user.userId;
    const body = req.body || {};
    const attachmentScope = await scopeForUser(userId, body.courseId, body.projectId);
    const s3ObjectKey = String(body.key || "").trim();
    if (!s3ObjectKey) return res.status(400).json({ message: "Missing key" });
    if (!s3ObjectKey.startsWith(attachmentScope.prefix)) {
      return res.status(403).json({ message: "Key out of scope" });
    }

    const deleteUrl = await s3.presignedDeleteUrl(s3ObjectKey, PRESIGN_URL_EXPIRES_SECONDS);
    res.json({ deleteUrl, expiresIn: PRESIGN_URL_EXPIRES_SECONDS });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "presign-delete failed" });
  }
});

// list all attachments under a course or project
router.get("/attachments/list", async (req, res) => {
  try {
    const userId = req.user.userId;
    const attachmentScope = await scopeForUser(userId, req.query.courseId, req.query.projectId);
    const files = await s3.listAllBucketFiles(attachmentScope.prefix);
    res.json({ files });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "list failed" });
  }
});

// load latest messages in a course
router.get("/:courseId", async (req, res) => {
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
      .populate("sender", "name email");
    res.json({ messages });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Failed to load messages" });
  }
});

module.exports = router;
