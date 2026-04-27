const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const { assertCourseAccess } = require("../utils/CourseUtils");
const { assertProjectMember } = require("../utils/projectUtils");
const { sanitizeFilename, scopeForUser } = require("../utils/MessageUtils");
const s3 = require("../services/s3");

const router = express.Router();
const PRESIGN_URL_EXPIRES_SECONDS = 900;

// presigned upload URL for attachments, body: { messageId, contentType, fileName, courseId, projectId }
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

    // constructing S3 key
    const relativeObjectKey = `${messageId}/${sanitizeFilename(body.fileName)}`;
    const key = attachmentScope.kind === "course"
        ? `courses/${attachmentScope.courseId}/${relativeObjectKey}`
        : `projects/${attachmentScope.projectId}/${relativeObjectKey}`;

    const putUrl = await s3.presignedPutUrl(key, contentType, PRESIGN_URL_EXPIRES_SECONDS);
    res.json({ putUrl, key, expiresIn: PRESIGN_URL_EXPIRES_SECONDS });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "presign-upload failed" });
  }
});

// presigned download URL for attachments, body: { messageId, attachmentIndex }
router.post("/attachments/presign-download", async (req, res) => {
  try {
    const userId = req.user.userId;
    const body = req.body || {};

    // validate messageId and attachmentIndex
    if (!mongoose.Types.ObjectId.isValid(body.messageId)) return res.status(400).json({ message: "Invalid messageId" });
    const attachmentIndex = parseInt(body.attachmentIndex, 10);
    if (!Number.isInteger(attachmentIndex) || attachmentIndex < 0) {
      return res.status(400).json({ message: "Invalid attachmentIndex" });
    }

    // load message and specific attachment
    const message = await Message.findById(body.messageId).select("courseId projectId attachments");
    if (!message) return res.status(404).json({ message: "Message Not found" });
    const attachment = message.attachments?.[attachmentIndex];
    if (!attachment?.url) return res.status(404).json({ message: "Attachment Not found" });

    // validate access to course or project
    if (message.courseId) await assertCourseAccess(message.courseId, userId);
    else await assertProjectMember(message.projectId, userId);

    // generate presigned download URL
    const getUrl = await s3.presignedGetUrl(attachment.url, PRESIGN_URL_EXPIRES_SECONDS);
    res.json({ getUrl, expiresIn: PRESIGN_URL_EXPIRES_SECONDS });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "presign-download failed" });
  }
});

// presigned delete URL for attachments, body: { key }
router.post("/attachments/presign-delete", async (req, res) => {
  try {
    const userId = req.user.userId;
    const body = req.body || {};
    const attachmentScope = await scopeForUser(userId, body.courseId, body.projectId);

    // validate key and scope
    const s3ObjectKey = String(body.key || "").trim();
    if (!s3ObjectKey) return res.status(400).json({ message: "Missing key" });
    if (!s3ObjectKey.startsWith(attachmentScope.prefix)) {
      return res.status(403).json({ message: "Key out of scope" });
    }

    // generate presigned delete URL
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

// load latest messages for either a course or a project
// route: /:type/:id where type is "course" or "project", plus ?limit=40&before=<ISO>
router.get("/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit || "40", 10), 100);
    const before = req.query.before ? new Date(req.query.before) : null;
    const filter = {};
    if (before && !Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };

    // validate type and filter messages
    if (type === "course") {
      await assertCourseAccess(id, userId);
      filter.courseId = id;
    } else if (type === "project") {
      await assertProjectMember(id, userId);
      filter.projectId = id;
    } else {
      return res.status(400).json({ message: "Invalid type. Use 'course' or 'project'" });
    }

    // get messages from the course or project
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
