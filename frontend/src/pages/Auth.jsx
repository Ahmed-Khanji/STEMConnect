import React, { useState } from "react";
import Register from "../components/Auth/Register";
import Login from "../components/Auth/Login";

export default function Auth() {
  const [mode, setMode] = useState("register"); // "register" | "login"

  return mode === "register" ? (
    <Register onSwitchToLogin={() => setMode("login")} />
  ) : (
    <Login onSwitchToRegister={() => setMode("register")} />
  );
}
