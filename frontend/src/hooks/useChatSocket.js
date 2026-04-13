import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Socket (browser) connects directly to API host (server)
const socketUrl = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export function useChatSocket(token) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Don’t connect without a token
    if (!token) return;
    // Prevent multiple socket connections
    if (socketRef.current) return;
    // Create socket connection
    const socket = io(socketUrl, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
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
  }, [token]);

  // Expose the socket instance
  return socketRef.current;
}