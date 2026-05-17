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
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
