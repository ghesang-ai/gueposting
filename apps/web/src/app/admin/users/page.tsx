"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Shield, ShieldOff } from "lucide-react";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  trustScore: number;
  role: "user" | "admin";
  createdAt: string;
  _count: { posts: number; followers: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingScore, setEditingScore] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState("");

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${p}&limit=20&search=${encodeURIComponent(q)}`);
      setUsers(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search); }, 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const updateTrustScore = async (userId: string) => {
    const score = parseFloat(scoreInput);
    if (isNaN(score) || score < 0 || score > 10) return;
    try {
      await api.patch(`/admin/users/${userId}/trust-score`, { trustScore: score });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, trustScore: score } : u));
      setEditingScore(null);
    } catch { alert("Gagal update trust score."); }
  };

  const toggleRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (!confirm(`${newRole === "admin" ? "Jadikan" : "Hapus"} admin untuk @${user.username}?`)) return;
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
    } catch { alert("Gagal update role."); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pengguna</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} total pengguna</p>
        </div>
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-8 h-9 text-sm" placeholder="Cari username..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div key={user.id} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{user.displayName}</span>
                    {user.role === "admin" && (
                      <Badge className="text-[10px] h-4 px-1.5 bg-foreground text-background">Admin</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">@{user.username} · {user._count.posts} post · {user._count.followers} pengikut</div>
                </div>

                {/* Trust score */}
                <div className="flex items-center gap-1.5">
                  {editingScore === user.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        className="w-16 h-7 text-xs text-center"
                        value={scoreInput}
                        onChange={(e) => setScoreInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") updateTrustScore(user.id); if (e.key === "Escape") setEditingScore(null); }}
                        autoFocus
                      />
                      <Button size="sm" className="h-7 text-xs px-2" onClick={() => updateTrustScore(user.id)}>OK</Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingScore(user.id); setScoreInput(user.trustScore.toString()); }}
                      className="text-xs bg-muted px-2 py-1 rounded-lg hover:bg-muted/80 transition-colors font-medium"
                      title="Klik untuk edit trust score"
                    >
                      ⭐ {user.trustScore.toFixed(1)}
                    </button>
                  )}
                </div>

                {/* Role toggle */}
                <button
                  onClick={() => toggleRole(user)}
                  className={`p-1.5 rounded-lg transition-colors ${user.role === "admin" ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                  title={user.role === "admin" ? "Hapus admin" : "Jadikan admin"}
                >
                  {user.role === "admin" ? <Shield size={15} /> : <ShieldOff size={15} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Hal {page} dari {Math.ceil(total / 20)}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(page - 1, search); }}>Sebelumnya</Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => { setPage(p => p + 1); load(page + 1, search); }}>Berikutnya</Button>
          </div>
        </div>
      )}
    </div>
  );
}
