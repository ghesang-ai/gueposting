"use client";

import { useEffect, useRef } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

function StatusPoller() {
  const { user, token, updateUser } = useAuthStore();
  const wasApprovedRef = useRef(false);

  useEffect(() => {
    if (!token || !user || user.status === "active") return;

    const check = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data?.status === "active" && user.status === "pending") {
          updateUser({ status: "active" });
          if (!wasApprovedRef.current) {
            wasApprovedRef.current = true;
            // Show browser notification if permitted
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("GUEPOSTING — Akunmu Disetujui! 🎉", {
                body: "Kamu sekarang bisa membuat postingan. Selamat bergabung!",
                icon: "/favicon.ico",
              });
            }
          }
        }
      } catch { }
    };

    check();
    const interval = setInterval(check, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [token, user?.status]);

  return null;
}

function PendingBanner() {
  const user = useAuthStore((s) => s.user);
  if (!user || user.status === "active") return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
      <p className="text-xs text-amber-800">
        ⏳ Akunmu sedang menunggu persetujuan admin. Kamu belum bisa membuat postingan.
      </p>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <StatusPoller />
      <PendingBanner />
      <main className="max-w-lg mx-auto pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
