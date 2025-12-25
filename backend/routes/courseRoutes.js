const express = require("express");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const { authenticateToken } = require("./authRoutes");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helpers: keep both User and Course synced
async function addUserToCourse(userId, courseId) {
  await Promise.all([
    // add course to user
    User.updateOne({ _id: userId }, { $addToSet: { courses: courseId } }),
    // add user to course
    Course.updateOne({ _id: courseId }, { $addToSet: { users: userId } }),
  ]);
}

async function removeUserFromCourse(userId, courseId) {
  await Promise.all([
    User.updateOne({ _id: userId }, { $pull: { courses: courseId } }),
    Course.updateOne({ _id: courseId }, { $pull: { users: userId } }),
  ]);
}


// POST /api/courses, Body: { name, code, color }, createdBy = logged-in user and auto-enroll creator into the course
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, code, color } = req.body;
    if (!name || !code || !color) return res.status(400).json({ message: "name and code are required" });

    const userId = req.user.userId;

    const course = await Course.create({
      name: String(name).trim(),
      code: String(code).trim().toUpperCase(),
      color: color,
      createdBy: userId,
      users: [userId], // creator is enrolled
      // status defaults to "unverified"
    });

    // sync: add course to user.courses
    await User.updateOne({ _id: userId }, { $addToSet: { courses: course._id } });

    return res.status(201).json({ course });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: `Course code already exists: ${JSON.stringify(err.keyValue)}` });
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});


// GET /api/courses, Returns ONLY courses the logged-in user is enrolled in (Optional: ?q=CS (search by name/code))
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const q = (req.query.q || "").trim();
    const filter = { users: userId };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ];
    }
    
    const courses = await Course.find(filter).sort({ createdAt: -1 });
    return res.json({ courses });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});


// GET /api/courses/:id, Only accessible if user is enrolled in the course
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid course id" });

    const userId = req.user.userId;
    const course = await Course.findOne({ _id: id, users: userId });
    if (!course) return res.status(404).json({ message: "Course not found or access denied" });

    return res.json({ course });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// PATCH /api/courses/:id, Only creator can update, Allowed: name, code, color (optional)
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid course id" });

    const userId = req.user.userId;

    const allowed = ["name", "code", "color"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No valid fields to update" });

    // normalize
    if (updates.name !== undefined) updates.name = String(updates.name).trim();
    if (updates.code !== undefined) updates.code = String(updates.code).trim().toUpperCase();
    if (updates.color !== undefined) updates.color = String(updates.color);

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.createdBy) !== String(userId)) {
      return res.status(403).json({ message: "Only the creator can update this course" });
    }

    Object.assign(course, updates);
    const saved = await course.save();

    return res.json({ course: saved });
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: `Duplicate key error: ${JSON.stringify(err.keyValue)}` });
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});


// DELETE /api/courses/:id, Only creator can delete, Also removes courseId from all users who had it
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid course id" });

    const userId = req.user.userId;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.createdBy) !== String(userId)) {
      return res.status(403).json({ message: "Only the creator can delete this course" });
    }

    // remove course from every enrolled user's User.courses
    await User.updateMany(
      { _id: { $in: course.users } },
      { $pull: { courses: course._id } }
    );

    await Course.deleteOne({ _id: course._id });

    return res.json({ message: "Course deleted" });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

/* =========================
   JOIN
   POST /api/courses/:id/join
   ========================= */
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid course id" });

    const userId = req.user.userId;

    const course = await Course.findById(id).select("_id");
    if (!course) return res.status(404).json({ message: "Course not found" });

    await addUserToCourse(userId, course._id);

    return res.json({ message: "Joined course" });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

/* =========================
   LEAVE
   POST /api/courses/:id/leave
   =========================
   Optional rule: creator can't leave (because they'd be locked out)
*/
router.post("/:id/leave", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid course id" });

    const userId = req.user.userId;

    const course = await Course.findById(id).select("createdBy");
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (String(course.createdBy) === String(userId)) {
      return res.status(400).json({ message: "Creator cannot leave their own course" });
    }

    await removeUserFromCourse(userId, course._id);

    return res.json({ message: "Left course" });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

/* =========================
   BONUS: Join by code (very useful)
   POST /api/courses/join-by-code
   Body: { code }
   ========================= */
router.post("/join-by-code", authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "code is required" });

    const userId = req.user.userId;

    const course = await Course.findOne({ code: String(code).trim().toUpperCase() }).select("_id");
    if (!course) return res.status(404).json({ message: "Course not found" });

    await addUserToCourse(userId, course._id);

    return res.json({ message: "Joined course", courseId: course._id });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

module.exports = router;
