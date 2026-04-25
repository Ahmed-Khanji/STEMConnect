const User = require("../../models/User");
const jwt = require('jsonwebtoken');
const express = require('express');

const router = express.Router();

// async wrapper so refresh rotation can await jwt.verify without nested callbacks
function verifyRefreshTokenAsync(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
}

// embeds refreshTokenVersion in refresh JWT so password bumps invalidate old tokens
function signRefreshToken(user) {
  const ver = user.refreshTokenVersion ?? 0;
  return jwt.sign(
    { userId: user._id, tokenVersion: ver },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']; // Expected format: "Bearer TOKEN"
    const token = authHeader?.split(' ')[1]; // Get the TOKEN part
    if (!token) return res.sendStatus(401); // Unauthorized
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.sendStatus(403); // Token invalid or expired
      // decoded payload
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        authProvider: decoded.authProvider
      };
      next();
    });
}

// GET /api/auth/me  (protected)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // req.user was set by authenticateToken from the JWT payload
    const user = await User.findById(req.user.userId).select("-password -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Return, frontend expects: { user: {...} }
    return res.json({
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        courses: user.courses, // array of ObjectIds
      },
    });
  } catch (err) {
    return res.status(500).json({ message: `Server error: ${err.message}` });
  }
});

// Register
router.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
      // Check if user already exists
      const emailNorm = email.trim().toLowerCase();
      const userExists = await User.findOne({ email: emailNorm });
      if (userExists) return res.status(409).json({ error: "User already exists" });
  
      // Create user
      const newUser = new User({
        name,
        email,
        password,
        authProvider: "local"
      });
      await newUser.save();

      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        return res.status(500).json({ message: `Server error: ${err.message}` });
    }
});

// Login (create Access and Refresh Token)
router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  
      const emailNorm = email.trim().toLowerCase();
      const user = await User.findOne({ email: emailNorm });
      if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
  
      const accessToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
          authProvider: user.authProvider
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
  
      const refreshToken = signRefreshToken(user);
      // store refresh token in DB
      user.refreshToken = refreshToken;
      await user.save();
  
      res.json({ accessToken, refreshToken });
    } catch (err) {
      return res.status(500).json({ message: `Server error: ${err.message}` });
    }
});
  

// Logout (Remove RefreshToken)
router.delete("/logout", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: "refreshToken is required" });

      const user = await User.findOne({ refreshToken });
      if (!user) return res.sendStatus(204); // already logged out, don't leak info
      // Invalidate token by removing it from DB
      user.refreshToken = null;
      await user.save();
  
      return res.sendStatus(204);
    } catch (err) {
      return res.status(500).json({ message: `Server error: ${err.message}` });
    }
});
  
// ==== Refresh Token (rotate refresh + new access token) ====
router.post("/token", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.sendStatus(401);

      const user = await User.findOne({ refreshToken });
      if (!user) return res.sendStatus(403);
      
      // verify the refresh token
      let decoded;
      try {
        decoded = await verifyRefreshTokenAsync(refreshToken);
      } catch {
        return res.sendStatus(403);
      }
      if (String(decoded.userId) !== String(user._id)) return res.sendStatus(403);

      // check if the refresh token version is the same as the user's refresh token version
      const ver = decoded.tokenVersion;
      const versionOk =
        Number(ver) === user.refreshTokenVersion ||
        (ver === undefined && (user.refreshTokenVersion ?? 0) === 0);
      if (!versionOk) return res.sendStatus(403);

      // sign a new access token
      const accessToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
          authProvider: user.authProvider
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );

      // sign a new refresh token
      const newRefresh = signRefreshToken(user);
      user.refreshToken = newRefresh;
      await user.save();

      // return the new access token and refresh token
      return res.status(200).json({ accessToken, refreshToken: newRefresh });
    } catch (err) {
      return res.status(500).json({ message: `Server error: ${err.message}` });
    }
});
  

module.exports = {
    authRoutes: router, // the name will exported as authRoutes for all routers
    authenticateToken
};
