"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, GitCompare, Plus, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/feed/PostCard";
import { cn } from "@/lib/utils";

interface Gadget {
  id: string;
  name: string;
  brand: string;
  category: string;
  specs: Record<string, string>;
  avgScore: number;
  reviewCount: number;
  imageUrl: string | null;
}

interface Post {
  id: string;
  content: string;
  type: string;
  rating: number | null;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null; trustScore: number };
  gadget: { id: string; name: string; brand: string; imageUrl: string | null } | null;
}

export default function GadgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [gadget, setGadget] = useState<Gadget | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    const load = async () => {
      try {
        const [gRes, pRes] = await Promise.all([
          api.get(`/gadgets/${id}`),
          api.get(`/posts?gadgetId=${id}&limit=10`),
        ]);
        setGadget(gRes.data);
        setPosts(pRes.data.data ?? pRes.data);
        if (user) {
          const ownerRes = await api.get(`/users/${user.id}/gadgets`).catch(() => ({ data: [] }));
          setOwned((ownerRes.data as Gadget[]).some((g) => g.id === id));
        }
      } catch {
        router.back();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token, user, router]);

  const toggleOwned = async () => {
    if (!gadget) return;
    try {
      if (owned) {
        await api.delete(`/users/me/gadgets/${gadget.id}`);
      } else {
        await api.post(`/users/me/gadgets`, { gadgetId: gadget.id });
      }
      setOwned(!owned);
    } catch { /* silent */ }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!gadget) return null;

  const specEntries = Object.entries(gadget.specs ?? {});

  return (
    <div>
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-sm truncate">{gadget.brand} {gadget.name}</span>
      </header>

      <div className="px-4 py-5 space-y-5">
        {/* Hero */}
        <div className="flex gap-4 items-start">
          <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {gadget.imageUrl ? (
              <img src={gadget.imageUrl} alt={gadget.name} className="w-24 h-24 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; (e.currentTarget.nextSibling as HTMLElement).style.display = "block"; }} />
            ) : null}
            <span className="text-3xl" style={{ display: gadget.imageUrl ? "none" : "block" }}>📱</span>
          </div>
          <div className="flex-1 space-y-1.5">
            <p className="text-xs text-muted-foreground">{gadget.brand}</p>
            <h1 className="text-lg font-bold leading-tight">{gadget.name}</h1>
            <Badge variant="secondary" className="text-xs capitalize">{gadget.category}</Badge>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-semibold">{gadget.avgScore.toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground">{gadget.reviewCount} ulasan</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant={owned ? "secondary" : "default"}
            size="sm"
            className="flex-1 gap-2"
            onClick={toggleOwned}
          >
            {owned ? <Check size={14} /> : <Plus size={14} />}
            {owned ? "Dimiliki" : "Tambah ke Gadgetku"}
          </Button>
          <Link href={`/compare?gadget=${gadget.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <GitCompare size={14} />
              Bandingkan
            </Button>
          </Link>
        </div>

        {/* Specs */}
        {specEntries.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Spesifikasi</h2>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {specEntries.map(([key, val]) => (
                <div key={key} className="flex px-3 py-2.5 gap-3">
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0 capitalize">{key}</span>
                  <span className="text-xs font-medium">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="border-t border-border">
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold">Ulasan & Postingan</h2>
        </div>
        <div className={cn("divide-y divide-border", posts.length === 0 && "px-4 py-8 text-center text-sm text-muted-foreground")}>
          {posts.length === 0
            ? "Belum ada ulasan untuk gadget ini"
            : posts.map((p) => <PostCard key={p.id} post={p} />)
          }
        </div>
      </div>
    </div>
  );
}
