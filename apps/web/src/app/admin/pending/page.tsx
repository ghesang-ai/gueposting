"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, User, Mail, Phone, Smartphone, Clock } from "lucide-react";

interface PendingUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  phone?: string;
  currentGadgetId?: string;
  createdAt: string;
  _count: { posts: number };
}

export default function PendingUsersPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get("/admin/users/pending");
      setUsers(res.data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setProcessing(id);
    try {
      await api.patch(`/admin/users/${id}/approve`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch { } finally {
      setProcessing(null);
    }
  };

  const reject = async (id: string, name: string) => {
    if (!confirm(`Tolak dan hapus akun ${name}?`)) return;
    setProcessing(id);
    try {
      await api.delete(`/admin/users/${id}/reject`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch { } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Persetujuan Member</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Approve atau tolak pendaftar baru. Setelah di-approve, mereka bisa membuat postingan.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Memuat...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 border rounded-2xl bg-muted/20">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-green-500" />
          <p className="font-semibold">Tidak ada pendaftar yang menunggu</p>
          <p className="text-sm text-muted-foreground mt-1">Semua sudah diproses!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{users.length} pendaftar menunggu persetujuan</p>
          {users.map((u) => (
            <div key={u.id} className="bg-background border rounded-2xl p-5 flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-sm">{u.displayName[0]}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <p className="font-semibold text-sm">{u.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail size={11} /> {u.email}
                  </span>
                  {u.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone size={11} /> {u.phone}
                    </span>
                  )}
                  {u.currentGadgetId && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Smartphone size={11} /> Punya gadget
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={11} /> {new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  disabled={processing === u.id}
                  onClick={() => reject(u.id, u.displayName)}
                >
                  <XCircle size={14} className="mr-1" />
                  Tolak
                </Button>
                <Button
                  size="sm"
                  disabled={processing === u.id}
                  onClick={() => approve(u.id)}
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  {processing === u.id ? "..." : "Approve"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
