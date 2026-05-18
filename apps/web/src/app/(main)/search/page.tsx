"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X, Sparkles, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { PostCard } from "@/components/feed/PostCard";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "ai",      label: "GUE AI ✨" },
  { value: "posts",   label: "Post" },
  { value: "users",   label: "Orang" },
  { value: "gadgets", label: "Gadget" },
] as const;
type Tab = typeof TABS[number]["value"];

const AI_SUGGESTIONS = [
  "HP gaming terbaik di bawah 5 juta",
  "Laptop untuk mahasiswa tipis dan ringan",
  "Earphone wireless noise cancelling terbaik",
  "HP kamera terbaik budget 3 jutaan",
  "Smartwatch untuk olahraga terbaik",
];

const CATEGORY_EMOJI: Record<string, string> = {
  smartphone: "📱", laptop: "💻", tablet: "📟", wearable: "⌚", audio: "🎧", other: "🔌",
};

interface AiGadget {
  id: string; name: string; brand: string; category: string;
  imageUrl: string | null; avgScore: number; reviewCount: number; reason?: string;
}
interface AiResult { answer: string; gadgets: AiGadget[] }

export default function SearchPage() {
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();
  const [tab, setTab] = useState<Tab>("ai");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [gadgets, setGadgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI state
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAsked, setAiAsked] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.push("/login");
    else if (tab !== "ai") inputRef.current?.focus();
  }, [token, router, _hasHydrated, tab]);

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
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "ai") return;
    const t = setTimeout(() => search(query), 400);
    return () => clearTimeout(t);
  }, [query, search, tab]);

  const askAI = async (q?: string) => {
    const question = (q ?? aiQuery).trim();
    if (!question || aiLoading) return;
    if (q) setAiQuery(q);
    setAiLoading(true);
    setAiAsked(true);
    setAiResult(null);
    try {
      const res = await api.post("/ai/ask", { question });
      setAiResult(res.data);
    } catch {
      setAiResult({ answer: "Maaf, GUE AI sedang sibuk. Coba lagi ya!", gadgets: [] });
    } finally { setAiLoading(false); }
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#c0281f] px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white flex-shrink-0">
            <ArrowLeft size={22} />
          </button>
          {tab === "ai" ? (
            <p className="flex-1 text-white font-bold text-lg text-center pr-6">Search & Ask</p>
          ) : (
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
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap",
                tab === t.value
                  ? t.value === "ai" ? "bg-white text-[#c0281f]" : "bg-white text-[#c0281f]"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 pt-3 pb-24 space-y-3">

        {/* ── GUE AI TAB ───────────────────────────────────────────────────────── */}
        {tab === "ai" && (
          <div className="space-y-3">
            {/* Branding */}
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#d42b2b] flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-white" strokeWidth={1.8} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">GUE AI Assistant</p>
                <p className="text-xs text-gray-400 mt-0.5">Tanya apa saja tentang gadget</p>
              </div>
            </div>

            {/* Input */}
            <div className="bg-white rounded-2xl p-3 flex items-end gap-2 shadow-sm border border-red-100">
              <textarea
                className="flex-1 text-sm text-gray-800 resize-none outline-none placeholder:text-gray-400 max-h-28"
                rows={2}
                placeholder="Contoh: HP gaming terbaik di bawah 5 juta..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAI(); } }}
              />
              <button
                onClick={() => askAI()}
                disabled={!aiQuery.trim() || aiLoading}
                className="w-9 h-9 rounded-xl bg-[#d42b2b] flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
              >
                {aiLoading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send size={16} className="text-white" strokeWidth={2} />}
              </button>
            </div>

            {/* Suggestions */}
            {!aiAsked && (
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">💡 Coba tanya:</p>
                {AI_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => askAI(s)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-[#d42b2b] transition-colors text-left"
                  >
                    <span className="text-sm text-gray-700">{s}</span>
                    <span className="text-[#d42b2b] text-sm ml-2">→</span>
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {aiLoading && (
              <div className="flex items-center justify-center gap-3 py-8 text-gray-400">
                <div className="w-5 h-5 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">GUE AI sedang berpikir...</span>
              </div>
            )}

            {/* Result */}
            {aiResult && !aiLoading && (
              <div className="space-y-3">
                {/* Answer bubble */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-[#d42b2b]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-[#d42b2b] flex items-center justify-center">
                      <Sparkles size={13} className="text-white" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-bold text-[#d42b2b]">GUE AI</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">{aiResult.answer}</p>
                </div>

                {/* Gadget recommendations */}
                {aiResult.gadgets.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                    <p className="font-bold text-sm text-gray-900">Rekomendasi Untukmu:</p>
                    {aiResult.gadgets.map((g, i) => (
                      <button
                        key={g.id}
                        onClick={() => router.push(`/gadget/${g.id}`)}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors text-left"
                      >
                        <span className="w-6 h-6 rounded-full bg-[#d42b2b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {g.imageUrl
                            ? <img src={g.imageUrl} alt={g.name} className="w-10 h-10 object-contain" />
                            : <span className="text-2xl">{CATEGORY_EMOJI[g.category] ?? "📱"}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{g.brand} {g.name}</p>
                          {g.reason && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{g.reason}</p>}
                          {(g.reviewCount ?? 0) > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">⭐ {g.avgScore?.toFixed(1)} · {g.reviewCount} review</p>
                          )}
                        </div>
                      </button>
                    ))}

                    {aiResult.gadgets.length >= 2 && (
                      <button
                        onClick={() => router.push("/compare")}
                        className="w-full py-3 rounded-xl bg-[#d42b2b] text-white text-sm font-bold hover:bg-[#b91c1c] transition-colors"
                      >
                        ⚖️ Lihat Perbandingan
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setAiAsked(false); setAiResult(null); setAiQuery(""); }}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2"
                >
                  Tanya hal lain ↩
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── NORMAL SEARCH TABS ─────────────────────────────────────────────── */}
        {tab !== "ai" && (
          <>
            {!query.trim() && (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
                <Search size={36} className="text-gray-300" />
                <p className="text-sm font-medium">Ketik untuk mencari</p>
              </div>
            )}

            {loading && query && (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && query && (
              <>
                {tab === "posts" && (
                  posts.length === 0
                    ? <div className="text-center py-16 text-gray-400 text-sm">Tidak ada post ditemukan</div>
                    : posts.map((post) => <PostCard key={post.id} post={post} />)
                )}

                {tab === "users" && (
                  users.length === 0
                    ? <div className="text-center py-16 text-gray-400 text-sm">Tidak ada orang ditemukan</div>
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
                          </button>
                        ))}
                      </div>
                )}

                {tab === "gadgets" && (
                  gadgets.length === 0
                    ? <div className="text-center py-16 text-gray-400 text-sm">Tidak ada gadget ditemukan</div>
                    : <div className="grid grid-cols-2 gap-3">
                        {gadgets.map((g: any) => (
                          <button key={g.id} onClick={() => router.push(`/gadget/${g.id}`)}
                            className="bg-white rounded-2xl p-3 space-y-2 text-left hover:bg-gray-50 transition-colors">
                            <div className="w-full aspect-square rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                              {g.imageUrl
                                ? <img src={g.imageUrl} alt={g.name} className="object-contain w-full h-full p-2" />
                                : <span className="text-4xl">{CATEGORY_EMOJI[g.category] ?? "📱"}</span>}
                            </div>
                            <p className="text-[10px] text-gray-400">{g.brand}</p>
                            <p className="text-xs font-semibold leading-tight line-clamp-2">{g.name}</p>
                          </button>
                        ))}
                      </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
