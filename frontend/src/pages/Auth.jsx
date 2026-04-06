import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App } from "antd";
import Register from "@/components/Auth/Register";
import Login from "@/components/Auth/Login";
import { useAuth } from "@/context/AuthContext.jsx";

export default function Auth() {
  const [mode, setMode] = useState("register"); // "register" | "login"
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const error = params.get("error");

    if (error) {
      message.error("Google sign-in failed. Try again.");
      window.history.replaceState({}, "", "/auth"); // clear the URL params
      return;
    }

    if (!token && !refreshToken) return;

    if (token) localStorage.setItem("accessToken", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    window.history.replaceState({}, "", "/auth"); // clear the URL params

    // try to load user session after Google sign-in
    (async () => {
      try {
        await refreshUser();
        navigate("/");
      } catch {
        message.error("Could not load your session after Google sign-in.");
      }
    })();
  }, [navigate, message, refreshUser]);
	
  return mode === "register" ? (
    <Register onSwitchToLogin={() => setMode("login")} />
  ) : (
    <Login onSwitchToRegister={() => setMode("register")} />
  );
}