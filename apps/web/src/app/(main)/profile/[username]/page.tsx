"use client";

import { useParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { ProfileView } from "@/components/profile/ProfileView";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuthStore();
  const isOwn = user?.username === username;
  return <ProfileView username={username} isOwn={isOwn} />;
}
