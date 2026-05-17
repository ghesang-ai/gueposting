"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { PostCard } from "@/components/feed/PostCard";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "posts",   label: "Post" },
  { value: "users",   label: "Orang" },
  { value: "gadgets", label: "Gadget" },
] as const;

type Tab = typeof TABS[number]["value"];

export default function SearchPage() {
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [gadgets, setGadgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.push("/login");
    else inputRef.current?.focus();
  }, [token, router, _hasHydrated]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setPosts([]); setUsers([]); setGadgets([]); return; }
    setLoading(true);
    try {
      const [postsRes, usersRes, gadgetsRes] = await Promise.all([
        api.get(`/posts?search=${encodeURIComponent(q)}&limit=15`).catch(() => ({ data: [] })),
        api.get(`/users?search=${encodeURIComponent(q)}&limit=10`).catch(() => ({ data: [] })),
        api.get(`/gadgets?search=${encodeURIComponent(q)}&limit=10`).catch(() => ({ data: [] })),
      ]);
      setPosts(postsRes.data.data ?? postsRes.data ?? []);
      setUsers(usersRes.data.data ?? usersRes.data ?? []);
      setGadgets(gadgetsRes.data.data ?? gadgetsRes.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 400);
    return () => clearTimeout(t);
  }, [query, search]);

  const CATEGORY_EMOJI: Record<string, string> = {
    smartphone: "📱", laptop: "💻", tablet: "📟", wearable: "⌚", audio: "🎧", other: "🔌",
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#c0281f] px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white flex-shrink-0">
            <ArrowLeft size={22} />
          </button>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari post, orang, atau gadget..."
              className="w-full bg-white rounded-full py-2.5 pl-9 pr-9 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors",
                tab === t.value ? "bg-white text-[#c0281f]" : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 pt-3 pb-24 space-y-3">
        {/* Empty state */}
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
            <Search size={36} className="text-gray-300" />
            <p className="text-sm font-medium">Ketik untuk mencari</p>
            <p className="text-xs">Post, orang, atau gadget</p>
          </div>
        )}

        {/* Loading */}
        {loading && query && (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Results */}
        {!loading && query && (
          <>
            {/* Posts tab */}
            {tab === "posts" && (
              posts.length === 0
                ? <div className="flex flex-col items-center justify-center py-16 text-gray-400"><p className="text-sm">Tidak ada post ditemukan</p></div>
                : posts.map((post) => <PostCard key={post.id} post={post} />)
            )}

            {/* Users tab */}
            {tab === "users" && (
              users.length === 0
                ? <div className="flex flex-col items-center justify-center py-16 text-gray-400"><p className="text-sm">Tidak ada orang ditemukan</p></div>
                : <div className="bg-white rounded-2xl divide-y divide-gray-50 overflow-hidden">
                    {users.map((u: any) => (
                      <button key={u.id} onClick={() => router.push(`/profile/${u.username}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left">
                        <div className="w-10 h-10 rounded-full bg-[#d42b2b] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" /> : (u.displayName?.[0] ?? "U")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{u.displayName}</p>
                          <p className="text-xs text-gray-400">@{u.username}</p>
                        </div>
                        {u.trustScore > 0 && <span className="ml-auto text-[10px] text-gray-400">⭐ {u.trustScore.toFixed(1)}</span>}
                      </button>
                    ))}
                  </div>
            )}

            {/* Gadgets tab */}
            {tab === "gadgets" && (
              gadgets.length === 0
                ? <div className="flex flex-col items-center justify-center py-16 text-gray-400"><p className="text-sm">Tidak ada gadget ditemukan</p></div>
                : <div className="grid grid-cols-2 gap-3">
                    {gadgets.map((g: any) => (
                      <button key={g.id} onClick={() => router.push(`/gadget/${g.id}`)}
                        className="bg-white rounded-2xl p-3 space-y-2 text-left hover:bg-gray-50 transition-colors">
                        <div className="w-full aspect-square rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                          {g.imageUrl
                            ? <img src={g.imageUrl} alt={g.name} className="object-contain w-full h-full p-2" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                            : <span className="text-4xl">{CATEGORY_EMOJI[g.category] ?? "📱"}</span>
                          }
                        </div>
                        <p className="text-[10px] text-gray-400">{g.brand}</p>
                        <p className="text-xs font-semibold leading-tight line-clamp-2">{g.name}</p>
                      </button>
                    ))}
                  </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
