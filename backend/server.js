require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const passport = require("passport");
const http = require("http");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const setupSockets = require("./services/chatSocket");
const userRoutes = require("./routes/userRoutes");
const { authRoutes, authenticateToken } = require("./routes/auth/authRoutes");
const authGoogleRoutes = require("./routes/auth/authGoogle");
const courseRoutes = require("./routes/courseRoutes");
const messageRoutes = require("./routes/messageRoutes");
const quizRoutes = require("./routes/quiz");
const projectRoutes = require("./routes/project");

const app = express();
const PORT = process.env.PORT || 3000;
const frontendOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

// trust first proxy so IP-based rate limits work behind deploy proxies
app.set("trust proxy", 1);

// global limiter for overall API abuse protection
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again in a minute." },
});
// stricter limiter for auth endpoints to reduce credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again later." },
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // self means: only frontend origin is allowed to do that action
      baseUri: ["'self'"], // where base URI can be used
      formAction: ["'self'"], // where forms can be submitted to 
      frameAncestors: ["'none'"], // prevent embedding in frames
      objectSrc: ["'none'"], // prevent embedding of objects
      connectSrc: ["'self'", frontendOrigin], // where connections can be made (self means: only frontend origin is allowed to make connections)
      imgSrc: ["'self'", "data:", "https:"], // where images can load from (data: for base64, https: for external images)
      styleSrc: ["'self'", "'unsafe-inline'"], // where css can load from (unsafe-inline for inline styles because tailwind need this)
      scriptSrc: ["'self'"], // where scripts can load from
      upgradeInsecureRequests: [], // upgrade insecure requests to secure requests
    },
  },
  referrerPolicy: { policy: "no-referrer" },
}));
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(passport.initialize());
app.use(globalLimiter);
app.use("/api/auth", authLimiter);

// Routes
app.get('/', (req, res) => { res.send('STEMConnect API is running...'); });
app.get("/healthz", (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  if (!mongoConnected) return res.status(503).json({ status: "unhealthy", mongo: "disconnected" });
  return res.status(200).json({ status: "ok", mongo: "connected" });
});
app.use("/api/auth", authRoutes);
app.use("/auth", authGoogleRoutes);
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/courses", authenticateToken, courseRoutes);
app.use("/api/messages", authenticateToken, messageRoutes);
app.use("/api/quiz", authenticateToken, quizRoutes);
app.use("/api/projects", projectRoutes);

// Socket
const server = http.createServer(app);
const io = setupSockets(server);
app.set("io", io); // make io available to routes with req.app.get("io")

// tracks whether graceful shutdown is already in progress
let isShuttingDown = false;

// waits for a specific time between retry attempts
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// retries mongo connection with capped exponential backoff
async function connectMongoWithRetry() {
  const maxDelayMs = 30000; // 30 seconds
  const maxAttempts = 10; // 10 attempts max
  let attempt = 0;

  while (!isShuttingDown) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB");
      return;
    } catch (err) {
      attempt += 1;
      if (attempt >= maxAttempts) {
        throw new Error(`MongoDB connection failed after ${attempt} attempts: ${err.message}`);
      }
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), maxDelayMs); // 1000ms * 2 ^ (attempt - 1)
      console.error(`MongoDB connection failed (attempt ${attempt}). Retrying in ${delayMs}ms`, err);
      await sleep(delayMs);
    }
  }
}

// starts server only after mongo is connected
async function startServer() {
  await connectMongoWithRetry();
  if (isShuttingDown) return;
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// gracefully closes http and database connections on process signals
async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received. Starting graceful shutdown...`);

  server.close(async (err) => {
    if (err) {
      console.error("Error while closing HTTP server", err);
      process.exit(1);
      return;
    }

    try {
      await mongoose.disconnect();
      console.log("MongoDB disconnected. Shutdown complete.");
      process.exit(0);
    } catch (disconnectErr) {
      console.error("Error while disconnecting MongoDB", disconnectErr);
      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});