const { Server } = require("socket.io");
const Message = require("../models/Message");
const { assertCourseAccess } = require("../utils/CourseUtils");
const { assertProjectMember } = require("../utils/projectUtils");
const { validateMessagePayload } = require("../utils/MessageUtils");
const jwt = require("jsonwebtoken");

// extracts normalized client ip from x-forwarded-for or socket address
function getClientIp(socket) {
  const fwd = socket.handshake.headers["x-forwarded-for"]; // e.g "127.0.0.1, 192.168.1.1"
  if (typeof fwd === "string" && fwd.trim()) return fwd.split(",")[0].trim(); // return the first IP address
  return socket.handshake.address || "unknown"; // return the IP address of the client
}

module.exports = function setupSockets(server) {
    const io = new Server(server, {
        cors: { 
          origin: process.env.FRONTEND_URL || "http://localhost:5173",
          credentials: true,
        }
    });

    // burst guard to limit connection floods per ip
    const connectBuckets = new Map(); // tracks how many times an IP connected in the last window (IP → [timestamps])
    const concurrentByIp = new Map(); // tracks how many open socket connections one IP has right now (IP → count)
    const WINDOW_MS = 60000; // 60 seconds
    const MAX_CONNECTS_PER_WINDOW = 30; // If one IP connects 30+ times in a minute, block them. 
    const MAX_CONCURRENT_PER_IP = 10; // If one IP has 10+ open socket connections, block them.

    // socket auth + basic per-ip connection limits
    io.use((socket, next) => {
        try {
          const ip = getClientIp(socket);
          const now = Date.now();
          const bucket = connectBuckets.get(ip) || [];
          const recent = bucket.filter((ts) => now - ts < WINDOW_MS);
          // if the IP has connected 30+ times in the last minute, block them
          if (recent.length >= MAX_CONNECTS_PER_WINDOW) {
            return next(new Error("Too many connection attempts"));
          }
          // add the current connection time to the bucket
          recent.push(now);
          connectBuckets.set(ip, recent);

          // if the IP has 10+ open socket connections, block them
          const active = concurrentByIp.get(ip) || 0;
          if (active >= MAX_CONCURRENT_PER_IP) {
            return next(new Error("Too many active connections"));
          }

          const token = socket.handshake.auth?.token;
          if (!token) return next(new Error("No token"));
          const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          socket.user = { id: payload.userId };
          socket.clientIp = ip;
          concurrentByIp.set(ip, active + 1);
          next();
        } catch {
          next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        // release per-ip concurrent slot on disconnect
        socket.on("disconnect", () => {
          const ip = socket.clientIp;
          if (!ip) return;
          const active = concurrentByIp.get(ip) || 0;
          if (active <= 1) concurrentByIp.delete(ip);
          else concurrentByIp.set(ip, active - 1);
        });

        // join a course room
        socket.on("joinCourse", async ({ courseId }) => {
          try {
            await assertCourseAccess(courseId, socket.user.id);
            socket.join(`course:${courseId}`); // add this socket to a room
            socket.emit("joinedCourse", { courseId }); // send confirmation only to this user
          } catch (err) {
            socket.emit("errorMessage", { error: err.message, status: err.status || 500 });
          }
        });
        
        // leave a course room
        socket.on("leaveCourse", ({ courseId }) => {
          socket.leave(`course:${courseId}`);
          socket.emit("leftCourse", { courseId });
        });
    
        // send a message to a course room
        socket.on("sendCourseMessage", async ({ courseId, type = "text", content = "", attachments = [] }) => {
          try {
            await assertCourseAccess(courseId, socket.user.id);

            // validating message type: if text then must has content, if file then must has attachments
            const v = validateMessagePayload(type, content, attachments);
            if (v.error) {
              return socket.emit("errorMessage", { error: v.error, status: v.status });
            }

            // creating message
            const created = await Message.create({
              courseId,
              sender: socket.user.id,
              type: v.msgType,
              content: String(content),
              attachments: attachments,
            });
            const populated = await Message.findById(created._id).populate("sender", "name email");

            io.to(`course:${courseId}`).emit("newMessage", populated);
          } catch (err) {
            socket.emit("errorMessage", { error: err.message, status: err.status || 500 });
          }
        });

        // join a project workspace room
        socket.on("joinProject", async ({ projectId }) => {
          try {
            await assertProjectMember(projectId, socket.user.id);
            socket.join(`project:${projectId}`);
            socket.emit("joinedProject", { projectId });
          } catch (err) {
            socket.emit("errorMessage", { error: err.message, status: err.status || 500 });
          }
        });

        // leave a project workspace room
        socket.on("leaveProject", ({ projectId }) => {
          socket.leave(`project:${projectId}`);
          socket.emit("leftProject", { projectId });
        });

        // send a message to a project workspace room
        socket.on("sendProjectMessage", async ({ projectId, type = "text", content = "", attachments = [] }) => {
          try {
            await assertProjectMember(projectId, socket.user.id);

            // validating message type: if text then must has content, if file then must has attachments
            const v = validateMessagePayload(type, content, attachments);
            if (v.error) {
              return socket.emit("errorMessage", { error: v.error, status: v.status });
            }

            // creating message
            const created = await Message.create({
              projectId,
              sender: socket.user.id,
              type: v.msgType,
              content: String(content),
              attachments: attachments,
            });
            const populated = await Message.findById(created._id).populate("sender", "name email");

            // broadcast to project socket room
            io.to(`project:${projectId}`).emit("newMessage", populated);
          } catch (err) {
            socket.emit("errorMessage", { error: err.message, status: err.status || 500 });
          }
        });
    });
    
    return io;
}