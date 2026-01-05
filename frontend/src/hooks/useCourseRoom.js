import { useEffect } from "react";
import { markCourseRead } from "@/api/courseApi";

export function useCourseRoom({ socket, courseId, setMessages }) {
  useEffect(() => {
    if (!socket || !courseId) return;
    // Join the room for this course so server broadcasts reach you
    socket.emit("joinCourse", { courseId });

    const onNewMessage = (msg) => {
      // msg.course might be an id string OR a populated object
      const msgCourseId =
        typeof msg?.course === "object"
          ? String(msg.course?._id || msg.course?.id)
          : String(msg?.course);
      // Ignore messages for other courses
      if (msgCourseId !== String(courseId)) return;

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