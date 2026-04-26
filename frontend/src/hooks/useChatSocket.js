import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Socket (browser) connects directly to API host (server)
const socketUrl = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export function useChatSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    // Prevent multiple socket connections
    if (socketRef.current) return;
    // Don’t connect without an access token
    const initialToken = localStorage.getItem("accessToken");
    if (!initialToken) return;
    // Create socket connection
    const socket = io(socketUrl, {
      transports: ["websocket"],
      withCredentials: true,
      // Always read latest token on connect/reconnect attempts
      auth: (callback) => callback({ token: localStorage.getItem("accessToken") }),
    });
    socketRef.current = socket;

    // ---- Debug logs ----
    socket.on("connect", () => console.log("✅ socket connected:", socket.id));
    socket.on("errorMessage", (err) => console.warn("⚠️ socket connect_error:", err));

    // Cleanup on logout / unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Expose the socket instance
  return socketRef.current;
}