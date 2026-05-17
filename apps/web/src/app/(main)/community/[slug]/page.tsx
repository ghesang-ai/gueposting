"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { PostCard } from "@/components/feed/PostCard";
import { cn } from "@/lib/utils";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
  gadget: { id: string; name: string; brand: string; imageUrl: string | null } | null;
  _count: { members: number };
}

export default function CommunityDetailPage() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const { token, _hasHydrated } = useAuthStore();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.push("/login");
  }, [token, router, _hasHydrated]);

  useEffect(() => {
    if (!token || !slug) return;
    const load = async () => {
      try {
        const [cRes, postsRes] = await Promise.all([
          api.get(`/communities/${slug}`),
          api.get(`/posts?limit=20`),
        ]);
        setCommunity(cRes.data);
        setPosts(postsRes.data.data ?? postsRes.data);
      } catch {
        router.back();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, slug, router]);

  const toggleJoin = async () => {
    if (!community) return;
    setJoining(true);
    try {
      const res = await api.post(`/communities/${community.id}/join`);
      setCommunity((c) => c ? {
        ...c,
        isMember: res.data.joined,
        _count: { members: c._count.members + (res.data.joined ? 1 : -1) },
      } : c);
    } catch {} finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!community) return null;

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#c0281f] px-4 pt-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white">
            <ArrowLeft size={22} />
          </button>
          <span className="text-white font-bold text-base flex-1 truncate">{community.name}</span>
        </div>

        {/* Community info card */}
        <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {community.gadget?.imageUrl
              ? <img src={community.gadget.imageUrl} alt={community.gadget.name} className="w-14 h-14 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              : <span className="text-3xl">👥</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base">{community.name}</p>
            {community.description && (
              <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{community.description}</p>
            )}
            <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
              <Users size={11} /> {community._count.members.toLocaleString()} anggota
            </p>
          </div>
        </div>
      </header>

      {/* Join/Leave button */}
      <div className="px-4 pt-3">
        <button
          onClick={toggleJoin}
          disabled={joining}
          className={cn(
            "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors",
            community.isMember
              ? "bg-white border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-[#d42b2b]"
              : "bg-[#d42b2b] text-white hover:bg-[#b82424]"
          )}
        >
          {joining && <Loader2 size={15} className="animate-spin" />}
          {community.isMember ? "✓ Bergabung · Keluar" : "+ Bergabung"}
        </button>
      </div>

      {/* Posts */}
      <div className="px-3 pt-3 pb-24 space-y-3">
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-gray-700">Postingan Komunitas</p>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <p className="text-sm">Belum ada postingan</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
