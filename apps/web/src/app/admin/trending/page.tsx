"use client";

import { useEffect, useState, useCallback } from "react";
import { Flame, Search, Plus, Trash2, GripVertical } from "lucide-react";
import { api } from "@/lib/api";

interface Gadget {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  isTrending: boolean;
  trendingOrder: number | null;
  avgScore: number;
  reviewCount: number;
}

export default function AdminTrendingPage() {
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const trending = gadgets.filter(g => g.isTrending).sort((a, b) => (a.trendingOrder ?? 99) - (b.trendingOrder ?? 99));
  const others = gadgets.filter(g => !g.isTrending);

  const fetchGadgets = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/gadgets?search=${encodeURIComponent(q)}`);
      setGadgets(res.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGadgets(); }, [fetchGadgets]);

  useEffect(() => {
    const t = setTimeout(() => fetchGadgets(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchGadgets]);

  const toggle = async (gadget: Gadget, isTrending: boolean) => {
    if (isTrending && trending.length >= 6) {
      alert("Maksimal 6 gadget trending. Hapus salah satu dulu.");
      return;
    }
    setSaving(gadget.id);
    try {
      await api.patch(`/admin/gadgets/${gadget.id}/trending`, { isTrending });
      setGadgets(prev => prev.map(g =>
        g.id === gadget.id
          ? { ...g, isTrending, trendingOrder: isTrending ? (trending.length + 1) : null }
          : g
      ));
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Gagal mengubah status trending");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Flame size={22} className="text-[#d42b2b]" />
          Kelola Gadget Trending
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pilih maksimal 6 gadget yang ditampilkan di section Gadget Trending pada feed.
        </p>
      </div>

      {/* Trending sekarang */}
      <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Trending Sekarang</h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trending.length >= 6 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
            {trending.length}/6
          </span>
        </div>

        {trending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Belum ada gadget trending. Tambah dari daftar di bawah.</p>
        ) : (
          <div className="space-y-2">
            {trending.map((g, i) => (
              <div key={g.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {g.imageUrl
                    ? <img src={g.imageUrl} alt={g.name} className="w-full h-full object-contain" />
                    : <span className="text-base">📱</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{g.brand} {g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.category} · ⭐ {g.avgScore.toFixed(1)}</p>
                </div>
                <button
                  onClick={() => toggle(g, false)}
                  disabled={saving === g.id}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cari & tambah gadget */}
      <div className="bg-background border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-sm">Cari & Tambah Gadget</h2>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau brand gadget..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-input rounded-xl bg-muted/30 outline-none focus:border-[#d42b2b]"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : others.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {search ? "Tidak ada gadget ditemukan" : "Semua gadget sudah trending"}
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {others.map(g => (
              <div key={g.id} className="flex items-center gap-3 p-3 hover:bg-muted/40 rounded-xl transition-colors">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {g.imageUrl
                    ? <img src={g.imageUrl} alt={g.name} className="w-full h-full object-contain" />
                    : <span className="text-base">📱</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{g.brand} {g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.category} · ⭐ {g.avgScore.toFixed(1)} · {g.reviewCount} review</p>
                </div>
                <button
                  onClick={() => toggle(g, true)}
                  disabled={saving === g.id || trending.length >= 6}
                  className="flex items-center gap-1 text-xs font-semibold text-[#d42b2b] bg-red-50 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={12} />
                  Trending
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
