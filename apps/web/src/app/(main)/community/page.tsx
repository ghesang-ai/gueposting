"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
  gadget: { id: string; name: string; brand: string; imageUrl: string | null } | null;
  _count: { members: number };
}

const CATEGORY_EMOJI: Record<string, string> = {
  smartphone: "📱", laptop: "💻", tablet: "📟", wearable: "⌚", audio: "🎧", other: "🔌",
};

export default function CommunityListPage() {
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filtered, setFiltered] = useState<Community[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.push("/login");
  }, [token, router, _hasHydrated]);

  useEffect(() => {
    if (!token) return;
    api.get("/communities")
      .then((r) => {
        setCommunities(r.data);
        setFiltered(r.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(communities); return; }
    setFiltered(communities.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, communities]);

  return (
    <div className="bg-[#f5f5f5] min-h-screen">
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
            <Users size={18} className="text-white/80" />
            <span className="text-white/80 text-sm font-semibold">Komunitas</span>
          </div>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari komunitas..."
            className="w-full bg-white rounded-full py-2.5 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none"
          />
        </div>
      </header>

      <div className="px-3 pt-3 pb-24 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-gray-400">
            <Users size={36} className="text-gray-300" />
            <p className="text-sm">Belum ada komunitas</p>
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => router.push(`/community/${c.slug}`)}
              className="w-full bg-white rounded-2xl p-4 text-left flex items-center gap-4 hover:bg-gray-50 transition-colors shadow-sm"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {c.gadget?.imageUrl
                  ? <img src={c.gadget.imageUrl} alt={c.gadget.name} className="w-12 h-12 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  : <span className="text-3xl">👥</span>
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{c.name}</p>
                {c.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Users size={11} /> {c._count.members.toLocaleString()} anggota
                  </span>
                  {c.gadget && (
                    <span className="text-[11px] text-gray-400">· {c.gadget.brand} {c.gadget.name}</span>
                  )}
                </div>
              </div>

              <span className="text-gray-300 flex-shrink-0">›</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
