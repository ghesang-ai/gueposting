"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Search, Smartphone } from "lucide-react";
import Image from "next/image";

interface Gadget {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [query, setQuery] = useState("");
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [selected, setSelected] = useState<Gadget | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user]);

  useEffect(() => {
    if (query.length < 2) { setGadgets([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/gadgets?search=${encodeURIComponent(query)}&limit=8`);
        setGadgets(res.data.data ?? res.data);
      } catch { setGadgets([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const skip = async () => {
    router.push("/");
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.patch("/auth/onboarding", { gadgetId: selected.id });
      updateUser({ currentGadgetId: res.data.currentGadgetId });
      router.push("/");
    } catch {
      router.push("/");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gueposting-icon-red.png" alt="GUEPOSTING" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <span className="font-black text-2xl tracking-tight" style={{ fontFamily: "var(--font-brand)", color: "#d42b2b" }}>GUEPOSTING</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Selamat datang di GUEPOSTING!</h1>
          <p className="text-muted-foreground text-sm">
            Akunmu sedang menunggu persetujuan admin.<br/>
            Sambil menunggu, ceritakan gadget utama yang kamu pakai sekarang.
          </p>
        </div>

        {/* Status badge */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Menunggu Persetujuan Admin</p>
            <p className="text-xs text-amber-700 mt-0.5">Kamu sudah bisa lihat-lihat konten. Fitur posting akan aktif setelah disetujui.</p>
          </div>
        </div>

        {/* Gadget search */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Gadget utama kamu sekarang?</p>

          {selected ? (
            <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-3">
              {selected.imageUrl ? (
                <Image src={selected.imageUrl} alt={selected.name} width={40} height={40} className="object-contain" />
              ) : (
                <Smartphone size={24} className="text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{selected.brand} {selected.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{selected.category}</p>
              </div>
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
              <button
                onClick={() => { setSelected(null); setQuery(""); }}
                className="text-xs text-muted-foreground hover:text-foreground ml-1"
              >
                Ganti
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari gadget, contoh: iPhone 16, Galaxy S25..."
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {gadgets.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-xl shadow-lg overflow-hidden">
                  {gadgets.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => { setSelected(g); setGadgets([]); setQuery(""); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left"
                    >
                      {g.imageUrl ? (
                        <Image src={g.imageUrl} alt={g.name} width={32} height={32} className="object-contain flex-shrink-0" />
                      ) : (
                        <Smartphone size={20} className="text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{g.brand} {g.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{g.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={save} disabled={!selected || saving} size="lg" className="w-full">
            {saving ? "Menyimpan..." : "Simpan & Mulai Jelajahi"}
          </Button>
          <button
            onClick={skip}
            className="text-sm text-muted-foreground hover:text-foreground text-center py-1"
          >
            Lewati dulu
          </button>
        </div>
      </div>
    </div>
  );
}
