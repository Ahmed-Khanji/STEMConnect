const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Course = require("../models/Course");
const jwt = require("jsonwebtoken");

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
  
    const isEnrolled = course.users.some((u) => String(u) === String(userId));
    if (!isEnrolled) { 
      const err = new Error("Not allowed in this course");
      err.status = 403;
      throw err;
    }
  
    return course;
}

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
          const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
          socket.user = { id: payload.userId };
          next();
        } catch {
          next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
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
        
        socket.on("leaveCourse", ({ courseId }) => {
          socket.leave(`course:${courseId}`);
          socket.emit("leftCourse", { courseId });
        });
    
        socket.on("sendMessage", async ({ courseId, type = "text", content = "", attachments = [] }) => {
          try {
            await assertCourseAccess(courseId, socket.user.id);
            
            if (type === "text" && !String(content).trim()) {
              return socket.emit("errorMessage", { error: "Message content required", status: 400 });
            }
        
            const created = await Message.create({
              course: courseId,
              sender: socket.user.id,
              type,
              content: String(content),
              attachments: Array.isArray(attachments) ? attachments : [],
            });
        
            const populated = await Message.findById(created._id).populate("sender", "name email");
        
            io.to(`course:${courseId}`).emit("newMessage", populated);
          } catch (err) {
            socket.emit("errorMessage", { error: err.message, status: err.status || 500 });
          }
        });
    });
    
    return io;
}