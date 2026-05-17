"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, X, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Gadget {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  avgScore: number;
}

interface CompareResult {
  id: string;
  status: string;
  summary: string | null;
  recommendation: string | null;
  scores: Record<string, Record<string, number>>;
  gadgetIds: string[];
}

function ComparePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, _hasHydrated } = useAuthStore();

  const [selected, setSelected] = useState<Gadget[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Gadget[]>([]);
  const [budget, setBudget] = useState("");
  const [usecase, setUsecase] = useState("");
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [gadgetMap, setGadgetMap] = useState<Record<string, Gadget>>({});

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) { router.push("/login"); return; }
  }, [token, router, _hasHydrated]);

  // Pre-select gadget from URL param
  useEffect(() => {
    const gadgetId = searchParams.get("gadget");
    if (gadgetId && token) {
      api.get(`/gadgets/${gadgetId}`).then((res) => {
        setSelected([res.data]);
        setGadgetMap((m) => ({ ...m, [res.data.id]: res.data }));
      }).catch(() => {});
    }
  }, [searchParams, token]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const res = await api.get(`/gadgets?search=${encodeURIComponent(q)}&limit=8`);
      setResults(res.data.data ?? res.data);
    } catch { setResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 300);
    return () => clearTimeout(t);
  }, [search, doSearch]);

  const addGadget = (g: Gadget) => {
    if (selected.length >= 3 || selected.find((s) => s.id === g.id)) return;
    setSelected((prev) => [...prev, g]);
    setGadgetMap((m) => ({ ...m, [g.id]: g }));
    setSearch("");
    setResults([]);
  };

  const removeGadget = (id: string) => setSelected((prev) => prev.filter((g) => g.id !== id));

  const startCompare = async () => {
    if (selected.length < 2) return;
    setComparing(true);
    setCompareResult(null);
    try {
      const res = await api.post("/ai/compare", {
        gadgetIds: selected.map((g) => g.id),
        userBudget: budget ? parseInt(budget) : undefined,
        userUsecase: usecase || undefined,
      });

      // Poll until done
      const compId = res.data.id;
      let done = false;
      let attempts = 0;
      while (!done && attempts < 45) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await api.get(`/ai/compare/${compId}`);
        if (poll.data.status === "done" || poll.data.status === "failed") {
          setCompareResult(poll.data);
          done = true;
        }
        attempts++;
      }
    } catch {
      // silent
    } finally {
      setComparing(false);
    }
  };

  const scoreCategories = compareResult?.scores
    ? Object.keys(Object.values(compareResult.scores)[0] ?? {})
    : [];

  return (
    <div>
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold">AI Compare</span>
        <Sparkles size={16} className="text-amber-500" />
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Selected gadgets */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Pilih 2–3 gadget untuk dibandingkan</p>
          <div className="flex gap-2 flex-wrap">
            {selected.map((g) => (
              <div key={g.id} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                {g.imageUrl && (
                  <img src={g.imageUrl} alt={g.name} className="w-5 h-5 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                )}
                <span className="text-xs font-medium">{g.brand} {g.name}</span>
                <button onClick={() => removeGadget(g.id)} className="text-muted-foreground hover:text-foreground ml-1">
                  <X size={12} />
                </button>
              </div>
            ))}
            {selected.length < 3 && (
              <div className="text-xs text-muted-foreground flex items-center px-2">
                + {3 - selected.length} gadget lagi
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        {selected.length < 3 && (
          <div className="relative space-y-1">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 text-sm"
                placeholder="Cari gadget..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {results.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-background shadow-sm">
                {results
                  .filter((r) => !selected.find((s) => s.id === r.id))
                  .map((g) => (
                    <button
                      key={g.id}
                      onClick={() => addGadget(g)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {g.imageUrl
                          ? <img src={g.imageUrl} alt={g.name} className="w-8 h-8 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          : <span className="text-sm">📱</span>
                        }
                      </div>
                      <div>
                        <p className="text-xs font-medium">{g.brand} {g.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{g.category}</p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Optional context */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Konteks (opsional)</h2>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Budget (Rp)</label>
            <Input
              type="number"
              placeholder="contoh: 8000000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Kegunaan utama</label>
            <Input
              placeholder="contoh: gaming, foto, kerja, pelajar"
              value={usecase}
              onChange={(e) => setUsecase(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Compare button */}
        <Button
          className="w-full gap-2"
          disabled={selected.length < 2 || comparing}
          onClick={startCompare}
        >
          <Sparkles size={16} />
          {comparing ? "AI sedang menganalisis..." : "Bandingkan dengan AI"}
        </Button>

        {comparing && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">AI sedang membandingkan gadget...</p>
            <p className="text-xs text-muted-foreground">Biasanya 10–30 detik</p>
          </div>
        )}

        {/* Results */}
        {compareResult && compareResult.status === "done" && (
          <div className="space-y-4 pt-2">
            <div className="h-px bg-border" />
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              Hasil Perbandingan AI
            </h2>

            {/* Score table */}
            {scoreCategories.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="grid bg-muted px-3 py-2" style={{ gridTemplateColumns: `1fr repeat(${selected.length}, 1fr)` }}>
                  <span className="text-[10px] text-muted-foreground">Kategori</span>
                  {selected.map((g) => (
                    <span key={g.id} className="text-[10px] font-medium text-center truncate">{g.name}</span>
                  ))}
                </div>
                {scoreCategories.map((cat) => (
                  <div
                    key={cat}
                    className="grid px-3 py-2.5 border-t border-border"
                    style={{ gridTemplateColumns: `1fr repeat(${selected.length}, 1fr)` }}
                  >
                    <span className="text-xs text-muted-foreground capitalize">{cat}</span>
                    {selected.map((g) => {
                      const score = compareResult.scores[g.id]?.[cat] ?? 0;
                      const best = Math.max(...selected.map((s) => compareResult.scores[s.id]?.[cat] ?? 0));
                      return (
                        <span
                          key={g.id}
                          className={cn("text-xs font-semibold text-center", score === best ? "text-green-600" : "")}
                        >
                          {score}/10
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendation */}
            {compareResult.recommendation && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
                <p className="text-xs font-semibold text-amber-800">Rekomendasi AI</p>
                <p className="text-sm text-amber-900">{compareResult.recommendation}</p>
              </div>
            )}

            {/* Summary */}
            {compareResult.summary && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold">Ringkasan</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{compareResult.summary}</p>
              </div>
            )}
          </div>
        )}

        {compareResult?.status === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700">Perbandingan gagal. Coba lagi beberapa saat.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageInner />
    </Suspense>
  );
}
