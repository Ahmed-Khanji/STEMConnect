import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/authApi";
import { GoogleIcon, EyeIcon, EyeOffIcon } from "../ui/icons";

export default function Login({ onSwitchToRegister }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const nextErrors = {};
    const email = form.email?.trim().toLowerCase();
    const password = form.password?.trim();

    if (!email) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (email && !emailRegex.test(email)) nextErrors.email = "Email is not valid";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { accessToken, refreshToken } = await login({ email, password });

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      setTimeout(() => {}, 3000); // code to run after 3 seconds
      navigate("/");
    } catch (err) {
      const msg = err?.message || "Login failed";

      // map common backend messages into fields
      const lower = msg.toLowerCase();
      if (lower.includes("email") || lower.includes("user")) {
        setErrors({ email: msg });
      } else if (lower.includes("password") || lower.includes("credentials")) {
        setErrors({ password: msg });
      } else {
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    window.location.href = "http://localhost:3000/auth/google";
  }

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
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
              className={`mt-2 w-full rounded-xl bg-white/10 border px-4 py-3 text-sm outline-none focus:ring-2 
                ${
                  errors.email
                    ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20"
                    : "border-white/10 focus:border-purple-500/60 focus:ring-purple-500/20"
                }`}
            />
            {errors.email && <p className="mt-2 text-xs text-red-400">{errors.email}</p>}
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
                className={`w-full rounded-xl bg-white/10 border px-4 py-3 text-sm outline-none focus:ring-2 
                  ${
                    errors.password
                      ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20"
                      : "border-white/10 focus:border-purple-500/60 focus:ring-purple-500/20"
                  }`}
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
            {errors.password && (
              <p className="mt-2 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl bg-white text-black font-semibold py-3 transition
              ${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-white/90"}`}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/60">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-white font-semibold hover:text-purple-300 transition"
          >
            Sign up
          </button>
        </p>

        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-purple-500/10" />
      </div>
    </div>
  );
}
