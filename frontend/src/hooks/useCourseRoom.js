import { useEffect } from "react";
import { markCourseRead } from "@/api/courseApi";

export function useCourseRoom({ socket, courseId, setMessages }) {
  useEffect(() => {
    if (!socket || !courseId) return;
    // Join the room for this course
    socket.emit("joinCourse", { courseId });

    // msg is the populated part that comes from backend io.to(`course:${courseId}`).emit("newMessage", populated);
    const onNewMessage = (msg) => {
      // Ignore messages for other courses
      if (String(msg?.courseId) !== String(courseId)) return;

      // Append message once (dedupe by id to avoid duplicates)
      setMessages((prev) => {
        const msgId = String(msg?._id || msg?.id);
        const exists = prev.some((m) => String(m?._id || m?.id) === msgId);
        if (exists) return prev;
        return [...prev, msg];
      });
      
      // keep unread count at 0 while user is inside this chat
      markCourseRead(courseId).catch(() => {});
    };

    socket.on("newMessage", onNewMessage);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.emit("leaveCourse", { courseId });
    };
  }, [socket, courseId, setMessages]);
}