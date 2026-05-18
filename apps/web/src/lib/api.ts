import axios from "axios";

export const api = axios.create({
  // Use relative URL so requests go through Vercel's proxy (next.config rewrites)
  // This bypasses ISP-level blocking of Railway's IP range
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api/v1",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only force-logout if we actually had a token that got rejected.
    // Prevents false logouts caused by public endpoints returning 401
    // or race conditions before Zustand finishes hydrating.
    if (err.response?.status === 401 && typeof window !== "undefined") {
      const hadToken = !!localStorage.getItem("token");
      if (hadToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("gueposting-auth");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
