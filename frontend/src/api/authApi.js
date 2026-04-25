import client, { handleError } from "./client";


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

// Claims the short-lived gc_access/gc_refresh cookies set by the Google OAuth callback
export async function exchangeGoogleTokens() {
  try {
    const res = await client.get("/auth/google/exchange", { withCredentials: true });
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