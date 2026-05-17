"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/feed/PostCard";
import { formatDistance } from "@/lib/time";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
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
  comments?: Comment[];
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) { router.push("/login"); return; }
    api.get(`/posts/${id}`).then((res) => {
      setPost(res.data);
      setComments(res.data.comments ?? []);
    }).catch(() => router.back());
  }, [id, token, router]);

  const sendComment = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/comment`, { content: text.trim() });
      setComments((prev) => [...prev, res.data]);
      setText("");
      setPost((p) => p ? { ...p, commentCount: p.commentCount + 1 } : p);
    } catch { /* silent */ } finally {
      setSubmitting(false);
    }
  };

  if (!post) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={20} />
        </button>
        <span className="font-semibold text-sm">Postingan</span>
      </header>

      {/* Post */}
      <PostCard post={post} />

      {/* Comments */}
      <div className="border-t border-border flex-1">
        <div className="px-4 py-3">
          <span className="text-sm font-semibold">{post.commentCount} Komentar</span>
        </div>

        <div className="divide-y divide-border">
          {comments.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Belum ada komentar. Jadilah yang pertama!
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="px-4 py-3 flex gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={c.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{c.user.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{c.user.displayName}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDistance(c.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Comment input — sticky bottom */}
      <div className="sticky bottom-14 bg-background/90 backdrop-blur-xl border-t border-border px-4 py-2.5 flex gap-2 items-center">
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tulis komentar..."
          className="flex-1 text-sm h-9"
          onKeyDown={(e) => { if (e.key === "Enter") sendComment(); }}
        />
        <button
          onClick={sendComment}
          disabled={!text.trim() || submitting}
          className="text-foreground disabled:text-muted-foreground transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
