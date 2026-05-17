"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Invite {
  id: string;
  code: string;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
  createdBy: { username: string; displayName: string };
  usedBy: { username: string; displayName: string } | null;
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/invites?page=${p}&limit=20`);
      setInvites(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const generateInvites = async (count: number) => {
    setGenerating(true);
    try {
      const res = await api.post("/admin/invites", { count });
      setInvites((prev) => [...res.data, ...prev]);
      setTotal((t) => t + count);
    } catch {
      alert("Gagal membuat invite code.");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invite Code</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} total code</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => generateInvites(5)} disabled={generating}>
            <Plus size={14} className="mr-1" /> 5 Code
          </Button>
          <Button size="sm" onClick={() => generateInvites(1)} disabled={generating}>
            <Plus size={14} className="mr-1" /> {generating ? "..." : "1 Code"}
          </Button>
        </div>
      </div>

      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-2.5 bg-muted text-xs font-medium text-muted-foreground">
          <span>Kode</span>
          <span>Dibuat oleh</span>
          <span>Digunakan oleh</span>
          <span>Status</span>
        </div>
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 animate-pulse h-12 bg-background" />
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Belum ada invite code. Buat sekarang!</div>
        ) : (
          <div className="divide-y divide-border">
            {invites.map((inv) => {
              const used = !!inv.usedBy;
              const expired = isExpired(inv.expiresAt);
              return (
                <div key={inv.id} className="grid grid-cols-4 px-4 py-3 items-center hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded-lg">{inv.code}</code>
                    {!used && !expired && (
                      <button
                        onClick={() => copyCode(inv.code)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied === inv.code ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">@{inv.createdBy.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {inv.usedBy ? `@${inv.usedBy.username}` : "—"}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                    used ? "bg-green-100 text-green-700"
                    : expired ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-700"
                  }`}>
                    {used ? "Terpakai" : expired ? "Expired" : "Aktif"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Hal {page} dari {Math.ceil(total / 20)}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1); }}>Sebelumnya</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => { setPage(p => p + 1); load(page + 1); }}>Berikutnya</Button>
          </div>
        </div>
      )}
    </div>
  );
}
