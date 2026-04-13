import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { Send, Smile, Paperclip, Image as ImageIcon, Sun, Moon, Plus } from 'lucide-react';

import SearchCourse from './SearchCourse.jsx'

import { getMessages } from "@/api/messageApi";
import { markCourseRead } from "@/api/courseApi";
import { useAuth } from "@/context/AuthContext.jsx";
import { useTheme } from "@/context/ThemeContext";
import { useCourseRoom } from "@/hooks/useCourseRoom";

export default function ChatArea({ socket, course, onSelectCourse, onCreateClick }) {
  const { user } = useAuth();
  const myId = user?.userId || user?._id || user?.id;

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const courseId = useMemo(() => course?._id || course?.id, [course]);

  // Socket Logic — socket is owned by Course.jsx to enable global unread tracking
  useCourseRoom({ socket, courseId, setMessages });

  // Scroll refs
  const scrollRef = useRef(null);      // the scrollable MessagesArea div
  const bottomRef = useRef(null);      // the bottom anchor
  const prevLenRef = useRef(0);        // previous messages length
  const prevCourseIdRef = useRef(courseId); // previous course

  // When switching courses: reset tracking of scroll Refs and clear messages
  useLayoutEffect(() => {
    if (prevCourseIdRef.current !== courseId) {
      prevLenRef.current = 0;
      prevCourseIdRef.current = courseId;

      setMessages([]);
      setInputValue("");

      const container = scrollRef.current;
      if (container) container.scrollTop = 0;
    }
  }, [courseId]);

  // Scroll behavior (runs BEFORE paint => no visible jump)
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const prevLen = prevLenRef.current;
    const nextLen = messages.length;
    const isInitialLoad = prevLen === 0 && nextLen > 0;
    const isNewMessage = prevLen > 0 && nextLen > prevLen;

    const hasOverflow = container.scrollHeight > container.clientHeight;
    if (isInitialLoad) {
      if (hasOverflow) container.scrollTop = container.scrollHeight;
      else container.scrollTop = 0; // Explicitly keep at top when no overflow to prevent browser auto-scroll
    } 
    else if (isNewMessage) {
      if (hasOverflow) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    
    prevLenRef.current = nextLen;
  }, [messages, courseId]);

  // Double-check after paint to prevent browser from auto-scrolling when no overflow
  useEffect(() => {
    if (!loading && messages.length > 0) {
      const container = scrollRef.current;
      if (!container) return;
      
      // Use multiple checks to catch any browser auto-scroll
      const checkAndReset = () => {
        const hasOverflow = container.scrollHeight > container.clientHeight;
        if (!hasOverflow && container.scrollTop !== 0) {
          // If no overflow but scrolled away from top, reset to top
          container.scrollTop = 0;
        }
      };
      
      // Check immediately
      checkAndReset();
      // Check after next frame
      requestAnimationFrame(checkAndReset);
      // Check after a small delay to catch any late scroll
      setTimeout(checkAndReset, 10);
    }
  }, [loading, messages.length]);

  // Load messages whenever selected course changes
  useEffect(() => {
    let alive = true; // safety flag so if user changes courses, cancels the async request
    async function load() {
      if (!courseId) {
        setMessages([]);
        return;
      }
      try {
        setLoading(true);
        const data = await getMessages(courseId, { limit: 40 });
        if (!alive) return;
        // backend returns newest first (because sort {createdAt:-1}), UI usually wants oldest -> newest
        const list = Array.isArray(data?.messages) ? [...data.messages].reverse() : [];
        setMessages(list);
        // mark course as read when opened
        await markCourseRead(courseId).catch(() => {});
      } catch (err) {
        // optional: show toast rather than alert
        alert(err.message || "Failed to load messages");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => alive = false;
  }, [courseId]);
  
  // Reset message length tracking when course changes
  useEffect(() => {
    if (prevCourseIdRef.current !== courseId) {
      prevLenRef.current = 0;
      prevCourseIdRef.current = courseId;
    }
  }, [courseId]);
  

  // Handle when click send
  async function handleSend() {
    const text = inputValue.trim();
    if (!text || !courseId || sending || !socket) return;
  
    setSending(true);
    socket.emit("sendMessage", { courseId, type: "text", content: text });
    setInputValue("");
    setSending(false);
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TopHeader
        course={course}
        onSelectCourse={onSelectCourse}
        onCreateClick={onCreateClick}
      />

      <MessagesArea 
        course={course} 
        messages={messages} 
        loading={loading} 
        scrollRef={scrollRef}
        bottomRef={bottomRef} 
        myId={myId}
      />

      <InputArea
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleSend={handleSend}
        sending={sending}
        disabled={!courseId}
      />
    </div>
  );
}

function TopHeader({ course, onSelectCourse, onCreateClick }) {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <div className="border-b border-gray-200 rounded-lg px-6 py-3 overflow-visible relative z-40">
      <div className="flex items-center gap-20 py-1 overflow-visible">
        {/* Left: Course Title */}
        <div className="w-[240px] flex-shrink-0">
          <p
            className="text-sm font-semibold text-gray-900 truncate mb-1"
            title={course?.name}
          >
            {course?.name}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {course?.code}
            {Array.isArray(course?.users) ? ` • ${course.users.length} students` : ""}
          </p>
        </div>

        {/* Right: Search */}
        <div className="flex-1 min-w-0">
          <SearchCourse
            onSelectCourse={onSelectCourse}
            onCreateClick={onCreateClick}
            className="w-full max-w-2xl"
          />
        </div>
      </div>
    </div>
  );
}

function MessagesArea({ course, messages, loading, scrollRef, bottomRef, myId }) {
  const hasMessages = messages.length > 0;
  const showScroll = !loading && hasMessages;
  return (
    <div
      ref={scrollRef}
      className={`flex-1 p-6 space-y-4 transition-opacity ${
        loading ? "opacity-0 overflow-hidden" : "opacity-100"
      } ${showScroll ? "overflow-y-auto" : "overflow-hidden"}`}
    >
      {loading && (
        <div className="h-full flex items-center justify-center text-sm text-gray-500">
          Loading messages...
        </div>
      )}
      {!loading && messages.length === 0 && (
        <div className="h-full flex items-center justify-center text-sm text-gray-500">
          No messages yet.
        </div>
      )}

      {messages.map((message) => {
        const isOwn = String(message?.sender?._id) === String(myId);
        const senderName = message?.sender?.name || "User";
        const initials = senderName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join("");

        return (
          // wraps ONE full message row (avatar + message bubble)
          <div
            key={message._id || message.id}
            className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
          >
            {/* AVATAR: Displays sender initials with course color */}
            {!isOwn && (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                style={{ backgroundColor: course?.color || "#8B5CF6" }}
              >
                <span className="text-sm">{initials || "U"}</span>
              </div>
            )}

            {/* MESSAGE COLUMN: Holds sender name, message bubble, and timestamp */}
            <div
              className={`flex flex-col ${isOwn ? "items-end pr-4" : "items-start"} max-w-md`}
            >
              {!isOwn && (
                <span className="text-xs text-gray-600 mb-1 px-1">
                  {senderName}
                </span>
              )}

              <div
                className={`px-4 py-3 rounded-2xl ${
                  isOwn
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>

              <span className="text-xs text-gray-400 mt-1 px-1">
                {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                }
              </span>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}

function InputArea({ inputValue, setInputValue, handleSend, sending, disabled }) {
  return (
    <div className="border-t border-gray-300 p-4">
      <div className="flex items-end gap-3">
        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={disabled || sending}
        >
          <Paperclip className="w-5 h-5 text-gray-500" />
        </button>

        <button
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={disabled || sending}
        >
          <ImageIcon className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
          <input
            type="text"
            placeholder={disabled ? "Select a course to chat..." : "Type a message..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
            disabled={disabled || sending}
          />

          <button
            className="hover:scale-110 transition-transform"
            disabled={disabled || sending}
          >
            <Smile className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || sending || !inputValue.trim()}
          className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}