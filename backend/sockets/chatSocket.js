const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Course = require("../models/Course");
const jwt = require("jsonwebtoken");

module.exports = function setupSockets(server) {
    const io = new Server(server, {
        cors: { 
          origin: process.env.FRONTEND_URL || "http://localhost:5173",
          credentials: true,
        }
    });

    // socket auth
    io.use((socket, next) => {
        try {
          const token = socket.handshake.auth?.token;
          if (!token) return next(new Error("No token"));
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          socket.user = { id: payload.id };
          next();
        } catch {
          next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        // join a course room
        socket.on("joinCourse", async ({ courseId }) => {
          if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return socket.emit("errorMessage", { error: "Invalid courseId" });
          }
          socket.join(`course:${courseId}`); // add this socket to a room
          socket.emit("joinedCourse", { courseId }); // send confirmation only to this user
        });
    
        socket.on("leaveCourse", ({ courseId }) => {
          socket.leave(`course:${courseId}`);
          socket.emit("leftCourse", { courseId });
        });
    
        socket.on("sendMessage", async ({ courseId, type = "text", content = "", attachments = [] }) => {
          try {
            if (type === "text" && !String(content).trim()) {
              return socket.emit("errorMessage", { error: "Message content required" });
            }
            const created = await Message.create({
              course: courseId,
              sender: socket.user?.id,
              type,
              content,
              attachments,
            });
            const populated = await Message.findById(created._id).populate(
              "sender",
              "name email"
            );
            io.to(`course:${courseId}`).emit("newMessage", populated);
          } catch (err) {
            socket.emit("errorMessage", { error: err.message });
          }
        });
    });
    
    return io;
}