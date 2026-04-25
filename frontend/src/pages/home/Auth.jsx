import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App } from "antd";
import Register from "@/components/Auth/Register";
import Login from "@/components/Auth/Login";
import { useAuth } from "@/context/AuthContext.jsx";
import { exchangeGoogleTokens } from "@/api/authApi";

export default function Auth() {
  const [mode, setMode] = useState("register"); // "register" | "login"
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { refreshUser, loginWithTokens } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isGoogleCallback = params.get("google") === "success";
    const error = params.get("error");

    if (error) {
      message.error("Google sign-in failed. Try again.");
      window.history.replaceState({}, "", "/auth");
      return;
    }

    if (!isGoogleCallback) return;

    window.history.replaceState({}, "", "/auth");

    // claim the short-lived HttpOnly cookies set by the backend callback
    (async () => {
      try {
        const data = await exchangeGoogleTokens();
        loginWithTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        await refreshUser();
        navigate("/");
      } catch {
        message.error("Could not complete Google sign-in.");
      }
    })();
  }, [navigate, message, refreshUser, loginWithTokens]);
	
  return mode === "register" ? (
    <Register onSwitchToLogin={() => setMode("login")} />
  ) : (
    <Login onSwitchToRegister={() => setMode("register")} />
  );
}