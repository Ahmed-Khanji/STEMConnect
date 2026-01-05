import axios from "axios";

const API_BASE = "http://localhost:3000";

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

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

async function requestNewAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("Missing refresh token");

  const res = await axios.post(`${API_BASE}/api/auth/token`, { refreshToken });
  const newAccessToken = res.data.accessToken;

  localStorage.setItem("accessToken", newAccessToken);
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

export default client;