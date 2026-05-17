"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { ProfileView } from "@/components/profile/ProfileView";

export default function MyProfilePage() {
  const { token, user, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.push("/login");
  }, [token, router, _hasHydrated]);

  if (!_hasHydrated || !user) return (
    <div className="flex items-center justify-center h-screen bg-[#f5f5f5]">
      <div className="w-8 h-8 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return <ProfileView username={user.username} isOwn />;
}
