import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Register from "../components/Auth/Register";
import Login from "../components/Auth/Login";

export default function Auth() {
  const [mode, setMode] = useState("register"); // "register" | "login"
  const navigate = useNavigate();
	
	 useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      alert("Google sign-in failed. Try again."); // optional: show a nice message instead of alert
      window.history.replaceState({}, "", "/auth"); // clean the URL
      return;
    }

    if (token) {
      localStorage.setItem("accessToken", token);
      window.history.replaceState({}, "", "/auth"); // clean URL (remove ?token=...)
      navigate("/"); // go where you want after login
    }
  }, [navigate]); // will run everytime this page renders (navigate triggers when we are redirected)
	
  return mode === "register" ? (
    <Register onSwitchToLogin={() => setMode("login")} />
  ) : (
    <Login onSwitchToRegister={() => setMode("register")} />
  );
}