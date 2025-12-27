import client from "./client";

// -------- Helpers --------
function handleError(err) {
  const data = err?.response?.data;
  const msg = data?.error || data?.message || "Request failed";
  throw new Error(msg);
}

// -------- API calls --------
export async function register(payload) {
  try {
    const res = await client.post("/api/auth/register", payload);
    return res.data;
  } catch (err) {
    handleError(err);
  }
}

export async function login(payload) {
  try {
    const res = await client.post("/api/auth/login", payload);
    return res.data;
  } catch (err) {
    handleError(err);
  }
}

export async function getMe() {
  try {
    const res = await client.get("/api/auth/me");
    return res.data;
  } catch (err) {
    handleError(err);
  }
}