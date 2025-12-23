import axios from "axios";

// Axios instance
const API_BASE = "http://localhost:3000";
const AUTH_BASE = `${API_BASE}/api/auth`;
const authClient = axios.create({
    baseURL: AUTH_BASE,
    headers: {
      "Content-Type": "application/json",
    },
});

// -------- Helpers --------
function getAccessToken() {
    return localStorage.getItem("accessToken");
}

function handleError(err) {
    const data = err?.response?.data; // with axios, errors are inside response.data
    const msg =
      data?.error ||         // backend 400/401/409 errors
      data?.message ||       // backend 500 errors
      "Request failed";
  
    throw new Error(msg);
}

// -------- API calls --------
export async function register(payload) {
    // payload: { name, email, password }
    try {
      const res = await authClient.post("/register", payload);
      return res.data;
    } catch (err) {
      handleError(err);
    }
}

export async function login(payload) {
    // payload: { email, password }
    try {
      const res = await authClient.post("/login", payload);
      return res.data;
    } catch (err) {
      handleError(err);
    }
}