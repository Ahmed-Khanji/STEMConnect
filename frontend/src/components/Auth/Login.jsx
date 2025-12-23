import React, { useState } from "react";

export default function Login({ onSwitchToRegister }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: call your login API
    console.log("Login:", form);
  }

  function handleGoogle() {
    // TODO: redirect to your Google OAuth endpoint
    console.log("Google login");
  }

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        <h1 className="text-2xl font-semibold text-center">Welcome Back</h1>
        <p className="text-sm text-white/60 text-center mt-2">
          Log in to access your account.
        </p>

        {/* Social */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 hover:border-purple-500/40 hover:bg-purple-500/10 transition"
          >
            <GoogleIcon />
            <span className="text-sm font-medium">Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">Or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/70">Email</label>
            <input
              name="email"
              type="email"
              placeholder="eg. johnsmith@gmail.com"
              value={form.email}
              onChange={handleChange}
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="text-xs text-white/70">Password</label>
            <div className="mt-2 relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-white text-black font-semibold py-3 hover:bg-white/90 transition"
          >
            Log In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-white font-semibold hover:text-purple-300 transition"
          >
            Sign up
          </button>
        </p>

        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-purple-500/10" />
      </div>
    </div>
  );
}

/* --- Icons (same as Register, duplicated so each file is standalone) --- */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.657 32.91 29.27 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.997 6.053 29.727 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.997 6.053 29.727 4 24 4c-7.682 0-14.35 4.327-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.163 0 10.331-1.977 14.045-5.695l-6.483-5.311C29.538 34.737 26.894 36 24 36c-5.248 0-9.619-3.067-11.283-7.445l-6.518 5.02C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.793 2.217-2.271 4.102-4.241 5.305l.003-.002 6.483 5.311C36.1 40.1 44 36 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9.88 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a18.7 18.7 0 0 1-3.23 4.44"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6.11 6.11C3.93 7.57 2 12 2 12s3.5 7 10 7c1.01 0 1.97-.16 2.86-.44"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
