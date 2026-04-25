import axios from "axios";

const API_BASE = import.meta.env.MODE === "production" // when run vite build or npm run build, it becomes production
  ? "https://your-backend.render.com" // or your AWS URL (TODO: change to actual production backend URL)
  : "";

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// -------- Helpers --------
function handleError(err) {
  const data = err?.response?.data;
  const msg = data?.error || data?.message || "Request failed";
  throw new Error(msg);
}

// Attach token automatically
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto Refresh + Retry (get new AccessToken)
let isRefreshing = false; // prevents multiple refresh calls at the same time
let refreshQueue = []; // stores pending requests while refresh is happening

// helper to resolve/reject queued requests
function processQueue(error, newAccessToken = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newAccessToken);
  });
  refreshQueue = [];
}

// request a new access token from the server
async function requestNewAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("Missing refresh token");

  const res = await axios.post(`${API_BASE}/api/auth/token`, { refreshToken });
  const newAccessToken = res.data.accessToken;
  const newRefresh = res.data.refreshToken;
  if (newAccessToken) localStorage.setItem("accessToken", newAccessToken);
  if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

  return newAccessToken;
}

// Response interceptor: on 401/403 -> refresh -> retry
client.interceptors.response.use((res) => res, async (err) => {
    const status = err?.response?.status;
    const originalRequest = err?.config;
    // Only handle auth errors
    if (!originalRequest || (status !== 401 && status !== 403)) return Promise.reject(err);
    // Prevent infinite loop (if retry also fails)
    if (originalRequest._retry) return Promise.reject(err);
    originalRequest._retry = true;
    // If a refresh is already happening, wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(client(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await requestNewAccessToken();
      processQueue(null, newToken);
      // retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return client(originalRequest);
    } 
    catch (refreshError) {
      processQueue(refreshError, null);
      // refresh failed -> logout behavior
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export { handleError };
export default client;