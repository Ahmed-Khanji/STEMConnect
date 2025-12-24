import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register, login } from "../../api/authApi";
import { GoogleIcon, EyeIcon, EyeOffIcon } from "../ui/icons";

export default function Register({ onSwitchToLogin }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = {};
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email?.trim().toLowerCase();
    const password = form.password?.trim();

    if (!firstName) errors.firstName = "First name is required";
    if (!lastName) errors.lastName = "Last name is required";
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

    if (email && !emailRegex.test(email)) errors.email = "Email is not valid";
    if (password && !passwordRegex.test(password)) {
      errors.password =
        "Password must be 8+ chars and include upper, lower, number, special character";
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const name = `${firstName} ${lastName}`.trim();

      await register({ name, email, password });
      const { accessToken, refreshToken } = await login({ email, password });
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      setTimeout(() => {}, 3000); // code to run after 3 seconds
      navigate("/");
    } catch (err) {
      const msg = err?.message || "Something went wrong";

      if (msg.toLowerCase().includes("already exists")) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes("email")) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes("password")) {
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
        <h1 className="text-2xl font-semibold text-center">Register</h1>
        <p className="text-sm text-white/60 text-center mt-2">
          Fill up the form to create your account.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="First Name"
              name="firstName"
              placeholder="eg. John"
              value={form.firstName}
              onChange={handleChange}
              error={errors.firstName}
            />
            <Field
              label="Last Name"
              name="lastName"
              placeholder="eg. Smith"
              value={form.lastName}
              onChange={handleChange}
              error={errors.lastName}
            />
          </div>

          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="eg. johnsmith@gmail.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          {/* Password */}
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

            <p className="mt-2 text-[11px] text-white/40">
              Must be at least 8 characters.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl bg-white text-black font-semibold py-3 transition
              ${loading ? "opacity-60 cursor-not-allowed" : "hover:bg-white/90"}`}
          >
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="mt-6 text-center text-sm text-white/60">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-white font-semibold hover:text-purple-300 transition"
            >
              Log in
            </button>
          </p>
        </form>

        {/* subtle purple glow */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-purple-500/10" />
      </div>
    </div>
  );
}


function Field({ label, name, value, onChange, error, type = "text", placeholder }) {
    return (
      <div>
        <label className="text-xs text-white/70">{label}</label>
  
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`mt-2 w-full rounded-xl bg-white/10 border px-4 py-3 text-sm outline-none focus:ring-2 
            ${
              error
                ? "border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20"
                : "border-white/10 focus:border-purple-500/60 focus:ring-purple-500/20"
            }`}
        />
  
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    );
}
