"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { formatDistance } from "@/lib/time";
import { cn } from "@/lib/utils";

interface Notif {
  id: string;
  type: "like" | "comment" | "follow";
  read: boolean;
  createdAt: string;
  postId: string | null;
  actor: { id: string; username: string; displayName: string; avatarUrl: string | null };
  post: { id: string; content: string } | null;
}

const NOTIF_EMOJI: Record<string, string> = { like: "❤️", comment: "💬", follow: "👤" };
const NOTIF_MSG: Record<string, string> = {
  like: "bereaksi pada postinganmu",
  comment: "mengomentari postinganmu",
  follow: "mulai mengikutimu",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnread(res.data.count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const openPanel = async () => {
    setOpen((p) => !p);
    if (!open) {
      setLoading(true);
      try {
        const res = await api.get("/notifications");
        setNotifs(res.data);
        if (unread > 0) {
          await api.patch("/notifications/read-all");
          setUnread(0);
        }
      } catch {}
      finally { setLoading(false); }
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={openPanel} className="relative text-white p-2 rounded-xl transition-all duration-150 hover:bg-white/20 active:bg-white/30 active:scale-95">
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-white text-[#d42b2b] text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-10 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-sm">Notifikasi</h3>
            {notifs.some((n) => !n.read) && (
              <button onClick={() => { api.patch("/notifications/read-all"); setUnread(0); setNotifs(p => p.map(n => ({ ...n, read: true }))); }}
                className="text-[10px] text-[#d42b2b] font-semibold hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-300" />
              </div>
            ) : notifs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-gray-400">Belum ada notifikasi</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div key={n.id} className={cn("flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer", !n.read && "bg-red-50/40")}>
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={n.actor.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-[#d42b2b] text-white font-bold text-sm">
                        {n.actor.displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 text-sm leading-none">
                      {NOTIF_EMOJI[n.type]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 leading-snug">
                      <span className="font-bold">{n.actor.displayName}</span>{" "}
                      {NOTIF_MSG[n.type]}
                    </p>
                    {n.post && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">"{n.post.content}"</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">{formatDistance(n.createdAt)}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#d42b2b] flex-shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
