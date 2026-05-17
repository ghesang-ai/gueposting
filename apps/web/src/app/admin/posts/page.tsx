"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistance } from "@/lib/time";

interface Post {
  id: string;
  content: string;
  type: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
  gadget: { name: string; brand: string } | null;
}

const TYPE_COLOR: Record<string, string> = {
  review: "bg-blue-100 text-blue-700",
  photo: "bg-green-100 text-green-700",
  video: "bg-purple-100 text-purple-700",
  discussion: "bg-gray-100 text-gray-700",
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/posts?page=${p}&limit=20`);
      setPosts(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const deletePost = async (id: string) => {
    if (!confirm("Hapus post ini? Tindakan tidak bisa dibatalkan.")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    } catch {
      alert("Gagal menghapus post.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Moderasi Post</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} total post</p>
        </div>
      </div>

      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse flex gap-3">
                <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">Tidak ada post</div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <div key={post.id} className="p-4 flex gap-3 items-start hover:bg-muted/30 transition-colors">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={post.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{post.user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">@{post.user.username}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TYPE_COLOR[post.type] ?? "bg-muted"}`}>
                      {post.type}
                    </span>
                    {post.gadget && (
                      <span className="text-[10px] text-muted-foreground">{post.gadget.brand} {post.gadget.name}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">{formatDistance(post.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>❤️ {post.likeCount}</span>
                    <span>💬 {post.commentCount}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link href={`/post/${post.id}`} target="_blank">
                    <button className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                      <ExternalLink size={14} />
                    </button>
                  </Link>
                  <button
                    onClick={() => deletePost(post.id)}
                    disabled={deleting === post.id}
                    className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
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
