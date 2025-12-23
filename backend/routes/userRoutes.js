const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");

const router = express.Router();

// check if the id is a valid object id
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// sanitize the user object to remove the password and refresh token before sending to frontend
const sanitizeUser = (userDoc) => {
  if (!userDoc) return userDoc;
  const u = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete u.password;
  delete u.refreshToken;
  return u;
};

// GET /api/users/me expects req.user to exist
router.get("/me", (req, res) => {
    // In auth middleware later, you will set req.user = { userId, ... }
    if (!req.user?.userId) return res.status(401).json({ message: "Not authenticated" });
    return res.json({ message: "Attach auth middleware later", userId: req.user.userId });
  });

// POST /api/users Create a user (usually for admin/testing; normal signup will be in authRoutes)
router.post("/", async (req, res) => {
  try {
    const { name, email, password = null, authProvider = "local", oauthId = null } = req.body;
    if (!name || !email) return res.status(400).json({ message: "name and email are required" });

    const user = await User.create({
      name,
      email,
      password,
      authProvider,
      oauthId,
    });

    return res.status(201).json(sanitizeUser(user));
  } catch (err) {
    // Duplicate email / oauthId
    if (err?.code === 11000) return res.status(409).json({ message: `Duplicate key error: ${JSON.stringify(err.keyValue)} | ${err.message}` });
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// GET /api/users Supports: pagination: ?page=1&limit=10 search by name/email: ?q=ahmed filter by provider: ?provider=google
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 100);
    const skip = (page - 1) * limit;

    const q = (req.query.q || "").trim();
    const provider = (req.query.provider || "").trim(); // "local" | "google"
    const filter = {};
    if (provider) filter.authProvider = provider;
    if (q) {
      // the .$or is used to search for the name or email in MongoDB mongoose syntax
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({
      page,
      limit,
      total,
      users
    });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// GET /api/users/:id Get a user by id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid user id" });

    const user = await User.findById(id).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// PATCH /api/users/:id Allows updating: name, email, password (any combination)
router.patch("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid user id" });
  
      const allowed = ["name", "email", "password"];
      const updates = {};
      for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
      if (Object.keys(updates).length === 0) return res.status(400).json({ message: "No valid fields to update" });
  

      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (updates.password !== undefined) {
        if (!updates.password) return res.status(400).json({ message: "password is required" });
        if (user.authProvider !== "local") return res.status(400).json({ message: "Google users do not use local passwords" });
        user.password = updates.password;
      }
      if (updates.name !== undefined) user.name = updates.name;
      if (updates.email !== undefined) user.email = updates.email;
      const saved = await user.save();
      return res.json(saved);
    } catch (err) {
      if (err?.code === 11000) return res.status(409).json({ message: `Duplicate key error: ${JSON.stringify(err.keyValue)} | ${err.message}` });
      return res.status(500).json({ message: `Server error: ${err.message}` });
    }
});
  

// PATCH /api/users/:id/refresh-token  { refreshToken: "..." } for issuing a new refresh token
router.patch("/:id/refresh-token", async (req, res) => {
  try {
    const { id } = req.params;
    const { refreshToken } = req.body;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid user id" });
    if (!refreshToken) return res.status(400).json({ message: "refreshToken is required" });

    const user = await User.findByIdAndUpdate(
      id,
      { refreshToken },
      { new: true }
    ).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "Refresh token set" });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// DELETE /api/users/:id/refresh-token
router.delete("/:id/refresh-token", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid user id" });

    const user = await User.findByIdAndUpdate(id, { refreshToken: null }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "Refresh token cleared" });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: "Invalid user id" });

    const deleted = await User.findByIdAndDelete(id).select("-password -refreshToken");
    if (!deleted) return res.status(404).json({ message: "User not found" });

    return res.json({ message: "User deleted", user: deleted });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

module.exports = router;