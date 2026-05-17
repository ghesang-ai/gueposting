"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = params.get("token");
    if (!token) { router.replace("/login"); return; }

    (async () => {
      try {
        // Store token first so api interceptor can use it
        localStorage.setItem("token", token);
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAuth(res.data, token);
        router.replace("/");
      } catch {
        router.replace("/login");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Menghubungkan akun Google...</p>
      </div>
    </div>
  );
}
