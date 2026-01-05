import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

// Backend socket URL 
const SOCKET_URL = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export function useChatSocket(token) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Don’t connect without a token
    if (!token) return;
    // Prevent multiple socket connections
    if (socketRef.current) return;
    // Create socket connection
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
    });
    socketRef.current = socket;

    // ---- Debug / lifecycle logs ----
    socket.on("connect", () => console.log("✅ socket connected:", socket.id));
    socket.on("disconnect", (reason) => console.log("❌ socket disconnected:", reason));
    socket.on("connect_error", (err) => console.warn("⚠️ socket connect_error:", err.message));

    // Cleanup on logout / unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // Expose the socket instance
  return socketRef.current;
}
