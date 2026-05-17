"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, Star, MessageCircle, Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { PostCard } from "@/components/feed/PostCard";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "",           label: "Semua" },
  { value: "review",     label: "⭐ Review" },
  { value: "photo",      label: "📷 Foto" },
  { value: "discussion", label: "💬 Diskusi" },
  { value: "video",      label: "🎬 Video" },
] as const;

export default function ExplorePage() {
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.push("/login");
  }, [token, router, _hasHydrated]);

  const load = useCallback(async (p: number, currentFilter: string, currentSearch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "15" });
      if (currentFilter) params.set("type", currentFilter);
      if (currentSearch.trim()) params.set("search", currentSearch.trim());
      const endpoint = currentSearch.trim() ? `/posts?${params}` : `/posts/trending?${params}`;
      const res = await api.get(endpoint);
      const data = res.data.data ?? res.data;
      if (p === 1) setPosts(data);
      else setPosts((prev) => [...prev, ...data]);
      setHasMore(data.length === 15);
    } catch {
      if (p === 1) setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    setPage(1);
    setPosts([]);
    const t = setTimeout(() => load(1, filter, search), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [token, filter, search, load]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next, filter, search);
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#c0281f] px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gueposting-icon-light.png" alt="GP" style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: '14px' }} />
            <div className="flex flex-col leading-none">
            <span className="font-black text-white text-lg" style={{ fontFamily: "var(--font-brand)" }}>GUEPOSTING</span>
            <span className="text-white/70 font-medium" style={{ fontSize: 9 }}>Gadget User Experience, Posting & Sharing</span>
          </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-white/80" />
            <span className="text-white/80 text-sm font-semibold">Jelajah</span>
          </div>
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari postingan, gadget, topik..."
            className="w-full bg-white rounded-full py-2.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
          />
        </div>
        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors",
                filter === f.value
                  ? "bg-white text-[#c0281f]"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 pt-3 pb-24 space-y-3">
        {!search && !filter && (
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3">
            <TrendingUp size={16} className="text-[#d42b2b]" />
            <p className="text-sm font-semibold text-gray-700">Post Trending Minggu Ini</p>
          </div>
        )}

        {loading && page === 1 ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
            <p className="text-sm">Belum ada postingan</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}

        {hasMore && posts.length > 0 && !loading && (
          <button onClick={loadMore} className="w-full py-3 text-sm text-gray-500 hover:text-gray-700">
            Muat lebih banyak
          </button>
        )}
        {loading && page > 1 && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
