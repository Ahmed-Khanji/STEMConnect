const { Server } = require("socket.io");
const Message = require("../models/Message");
const { assertCourseAccess } = require("../utils/CourseUtils");
const { assertProjectMember } = require("../utils/projectUtils");
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
        
        // leave a course room
        socket.on("leaveCourse", ({ courseId }) => {
          socket.leave(`course:${courseId}`);
          socket.emit("leftCourse", { courseId });
        });
    
        // send a message to a course room
        socket.on("sendCourseMessage", async ({ courseId, type = "text", content = "", attachments = [] }) => {
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
            if (type === "text" && !String(content).trim()) {
              return socket.emit("errorMessage", { error: "Message content required", status: 400 });
            }

            // create message inside Message model 
            const created = await Message.create({
              project: projectId,
              sender: socket.user.id,
              type,
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