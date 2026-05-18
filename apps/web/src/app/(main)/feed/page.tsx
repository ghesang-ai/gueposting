"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { PostCard } from "@/components/feed/PostCard";
import { GadgetTrending } from "@/components/feed/GadgetTrending";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { cn } from "@/lib/utils";

function CreatePostBox() {
  const router = useRouter();
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#d42b2b] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">D</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">Apa yang baru?</p>
          <p className="text-xs text-gray-400">Bagikan ke komunitas GUEPOSTING</p>
        </div>
        <button onClick={() => router.push("/post/new")} className="flex items-center gap-1.5 bg-red-50 text-[#d42b2b] text-sm font-bold px-4 py-2 rounded-full border border-red-200 hover:bg-red-100 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Buat Post
        </button>
      </div>
      <div className="flex gap-2 border-t border-gray-100 pt-3">
        {[
          { icon: "🖼️", label: "Foto",    path: "/post/new" },
          { icon: "🎬", label: "Video",   path: "/post/new" },
          { icon: "📊", label: "Polling", path: "/post/poll" },
          { icon: "#️⃣", label: "Topik",   path: "/post/new" },
        ].map(({ icon, label, path }) => (
          <button key={label} onClick={() => router.push(path)} className="flex items-center gap-1.5 text-xs text-gray-500 font-medium hover:text-gray-700 flex-1 justify-center py-1">
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface Post {
  id: string;
  content: string;
  type: string;
  rating: number | null;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null; trustScore: number };
  gadget: { id: string; name: string; brand: string; imageUrl: string | null } | null;
  userReaction?: string | null;
  isBookmarked?: boolean;
  location?: string | null;
  taggedUserIds?: string[];
}

type Tab = "following" | "semua";

export default function FeedPage() {
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();
  const [tab, setTab] = useState<Tab>("semua");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Wait for Zustand hydration before checking auth — prevents false logout
  // on page load when token hasn't been read from localStorage yet.
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.push("/login");
  }, [token, router, _hasHydrated]);

  const fetchPosts = useCallback(async (p: number, currentTab: Tab) => {
    try {
      const url = currentTab === "following"
        ? `/posts/feed`
        : `/posts?page=${p}&limit=15`;
      const res = await api.get(url);
      const data: Post[] = res.data.data ?? res.data;
      if (p === 1) setPosts(data);
      else setPosts((prev) => [...prev, ...data]);
      setHasMore(currentTab === "semua" ? data.length === 15 : false);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!_hasHydrated || !token) return;
    setLoading(true);
    setPage(1);
    setPosts([]);
    fetchPosts(1, tab);
  }, [token, tab, fetchPosts, _hasHydrated]);

  const refresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPosts(1, tab);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, tab);
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      {/* Header merah */}
      <header className="sticky top-0 z-10">
        <div className="bg-[#c0281f] px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src="/gueposting-icon-light.png" alt="GUEPOSTING" style={{ height: '46px', width: '46px', objectFit: 'contain', borderRadius: '14px' }} />
              <div className="flex flex-col leading-none">
            <span className="font-black text-white text-xl" style={{ fontFamily: "var(--font-brand)" }}>GUEPOSTING</span>
            <span className="text-white/70 font-medium" style={{ fontSize: 9 }}>Gadget User Experience, Posting & Sharing</span>
          </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                disabled={refreshing || loading}
                className="text-white/80 hover:text-white active:scale-90 transition-transform"
                title="Refresh feed"
              >
                <svg
                  width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={refreshing ? "animate-spin" : ""}
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M8 16H3v5"/>
                </svg>
              </button>
              <NotificationBell />
            </div>
          </div>
          {/* Search bar */}
          <div className="relative mb-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder="Cari gadget, teman, atau topik..."
              readOnly
              onClick={() => router.push("/search")}
              className="w-full bg-white rounded-full py-2.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none cursor-pointer"
            />
          </div>
        </div>
        {/* Tabs — di bawah header merah, bg putih */}
        <div className="bg-white px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="flex gap-2">
            {(["semua", "following"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-5 py-1.5 rounded-full text-sm font-semibold transition-colors",
                  tab === t
                    ? "bg-[#d42b2b] text-white"
                    : "border border-gray-200 text-gray-500 hover:border-gray-400"
                )}
              >
                {t === "semua" ? "Semua" : "Mengikuti"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="space-y-3 px-3 pt-3 pb-24">
        <GadgetTrending />

        {/* Buat Post box */}
        <CreatePostBox />

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            {tab === "following" ? (
              <>
                <p className="text-sm font-medium">Belum ada postingan</p>
                <p className="text-xs">Ikuti orang untuk melihat postingan mereka</p>
                <button onClick={() => setTab("semua")} className="text-sm font-semibold text-[#d42b2b] underline mt-1">
                  Lihat semua postingan
                </button>
              </>
            ) : (
              <p className="text-sm">Belum ada postingan</p>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={() => setPosts((prev) => prev.filter((p) => p.id !== post.id))}
            />
          ))
        )}

        {hasMore && posts.length > 0 && (
          <button onClick={loadMore} className="w-full py-3 text-sm text-gray-500 hover:text-gray-700">
            Muat lebih banyak
          </button>
        )}
      </div>
    </div>
  );
}
