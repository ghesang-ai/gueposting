"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Bookmark, Star, Share2, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/time";

const REACTIONS = [
  { type: "love",    emoji: "❤️",  label: "Love" },
  { type: "fire",    emoji: "🔥",  label: "Hot" },
  { type: "wow",     emoji: "😮",  label: "Wow" },
  { type: "haha",    emoji: "😂",  label: "Haha" },
  { type: "like",    emoji: "👍",  label: "Suka" },
  { type: "cool",    emoji: "😍",  label: "Keren" },
  { type: "amazing", emoji: "🤩",  label: "Amazing" },
  { type: "perfect", emoji: "💯",  label: "Perfect" },
  { type: "rocket",  emoji: "🚀",  label: "Next Level" },
  { type: "sad",     emoji: "😢",  label: "Sedih" },
];

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  position: number;
}

interface Poll {
  id: string;
  question: string;
  endsAt: string;
  totalVotes: number;
  userVote: string | null;
  options: PollOption[];
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
  userReaction?: string | null;
  isBookmarked?: boolean;
  poll?: Poll | null;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    trustScore: number;
  };
  gadget: {
    id: string;
    name: string;
    brand: string;
    imageUrl: string | null;
  } | null;
}

function MediaCarousel({ urls, onIndexChange }: { urls: string[]; onIndexChange?: (i: number) => void }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isVideo = (url: string) => /\.(mp4|mov|webm)(\?|$)/i.test(url);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(i);
    onIndexChange?.(i);
  };

  const goTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  if (urls.length === 1) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black">
        <div className="relative aspect-square w-full">
          {isVideo(urls[0]) ? (
            <video src={urls[0]} controls className="w-full h-full object-contain" />
          ) : (
            <Image src={urls[0]} alt="media" fill className="object-cover" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black">
      {/* Scrollable track — CSS snap like Threads */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {urls.map((url, i) => (
          <div key={i} className="flex-none w-full snap-center aspect-square relative">
            {isVideo(url) ? (
              <video src={url} controls className="w-full h-full object-contain" />
            ) : (
              <Image src={url} alt={`media ${i + 1}`} fill className="object-cover" />
            )}
          </div>
        ))}
      </div>

      {/* Counter badge top-right */}
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
        {index + 1}/{urls.length}
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
        {urls.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn(
              "rounded-full h-1.5 transition-all duration-300",
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PollCard({ poll: initialPoll, postId }: { poll: Poll; postId: string }) {
  const [poll, setPoll] = useState(initialPoll);
  const [voting, setVoting] = useState(false);
  const hasVoted = poll.userVote !== null;
  const isExpired = new Date(poll.endsAt) < new Date();

  const vote = async (optionId: string) => {
    if (hasVoted || isExpired || voting) return;
    setVoting(true);
    try {
      const res = await api.post(`/posts/${postId}/poll/vote`, { optionId });
      setPoll(res.data);
    } catch {}
    finally { setVoting(false); }
  };

  const maxVotes = Math.max(...poll.options.map((o) => o.voteCount), 1);

  return (
    <div className="border border-gray-100 rounded-2xl p-3 space-y-2.5">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <span>📊</span>
        <span>POLLING</span>
        <span className="mx-1">·</span>
        <span>{isExpired ? "Polling berakhir" : `${daysLeft(poll.endsAt)} tersisa`}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
          const isWinner = hasVoted && opt.voteCount === maxVotes && poll.totalVotes > 0;
          const isMyVote = poll.userVote === opt.id;

          if (!hasVoted && !isExpired) {
            return (
              <button
                key={opt.id}
                onClick={() => vote(opt.id)}
                disabled={voting}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-[#d42b2b] hover:bg-red-50 transition-all text-left disabled:opacity-60"
              >
                <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                <span className="text-sm text-gray-800">{opt.text}</span>
              </button>
            );
          }

          return (
            <div key={opt.id} className={cn("rounded-xl overflow-hidden border", isMyVote ? "border-[#d42b2b]" : "border-gray-100")}>
              <div className="relative px-3 py-2.5">
                <div
                  className={cn("absolute inset-0 rounded-xl", isMyVote ? "bg-red-50" : isWinner ? "bg-blue-50" : "bg-gray-50")}
                  style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isMyVote && <span className="text-[#d42b2b] text-xs font-bold">✓</span>}
                    <span className="text-sm text-gray-800">{opt.text}</span>
                  </div>
                  <span className={cn("text-xs font-bold flex-shrink-0", isMyVote ? "text-[#d42b2b]" : "text-gray-500")}>{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400">{poll.totalVotes} suara</p>
    </div>
  );
}

function daysLeft(endsAt: string) {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "0 hari";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days} hari ${hours} jam`;
  return `${hours} jam`;
}

export function PostCard({ post }: { post: Post }) {
  const [userReaction, setUserReaction] = useState<string | null>(post.userReaction ?? null);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked ?? false);
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const pickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setShowPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const downloadImage = async () => {
    setShowMenu(false);
    const url = post.mediaUrls[activeMediaIndex];
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `gueposting-${post.id}-${activeMediaIndex + 1}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, "_blank");
    }
  };

  const copyPostLink = () => {
    setShowMenu(false);
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const react = async (type: string) => {
    setShowPicker(false);
    const removing = userReaction === type;
    const wasReacted = userReaction !== null;
    try {
      const res = await api.post(`/posts/${post.id}/like`, { type });
      setUserReaction(res.data.reactionType);
      if (removing) setLikeCount((n) => n - 1);
      else if (!wasReacted) setLikeCount((n) => n + 1);
    } catch {}
  };

  const toggleBookmark = async () => {
    try {
      if (bookmarked) {
        await api.delete(`/posts/${post.id}/bookmark`);
      } else {
        await api.post(`/posts/${post.id}/bookmark`);
      }
      setBookmarked(!bookmarked);
    } catch {}
  };

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Post oleh ${post.user.displayName} di GUEPOSTING`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/posts/${post.id}`);
        setComments(res.data.comments ?? []);
      } catch {}
      finally { setLoadingComments(false); }
    }
    if (next) setTimeout(() => commentInputRef.current?.focus(), 100);
  };

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${post.id}/comment`, { content: commentText.trim() });
      setComments((prev) => [...prev, res.data]);
      setCommentCount((n) => n + 1);
      setCommentText("");
    } catch {}
    finally { setSubmitting(false); }
  };

  const currentReaction = REACTIONS.find((r) => r.type === userReaction);

  return (
    <article className="bg-white rounded-2xl shadow-sm px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/profile/${post.user.username}`} className="flex items-center gap-2.5">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.user.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-[#d42b2b] text-white font-bold">{post.user.displayName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold leading-none">{post.user.displayName}</p>
              {post.user.trustScore >= 70 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#d42b2b"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">@{post.user.username} · {formatDistance(post.createdAt)}</p>
          </div>
        </Link>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30 min-w-[180px]">
              {post.mediaUrls.length > 0 && (
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                  {post.mediaUrls.length > 1 && (
                    <span className="ml-auto text-xs text-gray-400">{activeMediaIndex + 1}/{post.mediaUrls.length}</span>
                  )}
                </button>
              )}
              <div className="h-px bg-gray-100 mx-3" />
              <button
                onClick={copyPostLink}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 active:bg-gray-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Salin Link Post
              </button>
              <div className="h-px bg-gray-100 mx-3" />
              <button
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-[#d42b2b] hover:bg-red-50 active:bg-red-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                Laporkan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gadget tag */}
      {post.gadget && (
        <Link href={`/gadget/${post.gadget.id}`} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
          {post.gadget.imageUrl && (
            <img src={post.gadget.imageUrl} alt={post.gadget.name} className="w-8 h-8 rounded-lg object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          )}
          <p className="text-xs font-medium">{post.gadget.brand} {post.gadget.name}</p>
          {post.rating && (
            <div className="ml-auto flex items-center gap-1 text-amber-500">
              <Star size={12} fill="currentColor" />
              <span className="text-xs font-semibold">{post.rating}/10</span>
            </div>
          )}
        </Link>
      )}

      <p className="text-sm leading-relaxed">{post.content}</p>

      {/* Poll */}
      {post.poll && <PollCard poll={post.poll} postId={post.id} />}

      {/* Media carousel */}
      {post.mediaUrls.length > 0 && (
        <MediaCarousel urls={post.mediaUrls} onIndexChange={setActiveMediaIndex} />
      )}

      {/* Action bar */}
      <div className="flex items-center gap-5 pt-1 border-t border-gray-50">
        {/* Reaction */}
        <div className="relative" ref={pickerRef}>
          {showPicker && (
            <div className="absolute bottom-10 left-0 bg-white rounded-2xl shadow-xl border border-gray-100 grid grid-cols-5 gap-1 p-2 z-20 w-64">
              {REACTIONS.map((r) => (
                <button key={r.type} onClick={() => react(r.type)} title={r.label}
                  className={cn("text-2xl w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 hover:scale-125 hover:bg-gray-50", userReaction === r.type && "bg-red-50 scale-110")}>
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
          <button onClick={() => setShowPicker((p) => !p)}
            className={cn("flex items-center gap-1.5 text-sm font-medium transition-colors select-none", userReaction ? "text-[#d42b2b]" : "text-gray-400 hover:text-gray-600")}>
            <span className="text-base leading-none">{currentReaction ? currentReaction.emoji : "🤍"}</span>
            <span>{likeCount}</span>
          </button>
        </div>

        {/* Comment toggle */}
        <button onClick={toggleComments}
          className={cn("flex items-center gap-1.5 text-sm font-medium transition-colors", showComments ? "text-[#d42b2b]" : "text-gray-400 hover:text-gray-600")}>
          <MessageCircle size={18} strokeWidth={1.8} fill={showComments ? "currentColor" : "none"} />
          <span>{commentCount}</span>
        </button>

        {/* Share */}
        <button onClick={share} className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
          <Share2 size={16} strokeWidth={1.8} />
          <span>{copied ? "Link disalin!" : "Bagikan"}</span>
        </button>

        {/* Bookmark */}
        <button onClick={toggleBookmark}
          className={cn("ml-auto flex items-center transition-colors", bookmarked ? "text-[#d42b2b]" : "text-gray-400 hover:text-gray-600")}>
          <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} strokeWidth={1.8} />
        </button>
      </div>

      {/* Inline comments */}
      {showComments && (
        <div className="border-t border-gray-50 pt-3 space-y-3">
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-gray-300" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-center text-gray-400 py-2">Belum ada komentar. Jadilah yang pertama!</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                    <AvatarImage src={c.user.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-[#d42b2b] text-white text-xs font-bold">{c.user.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl px-3 py-2">
                      <p className="text-xs font-semibold text-gray-800">{c.user.displayName}</p>
                      <p className="text-sm text-gray-700 mt-0.5 leading-snug">{c.content}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 ml-3">{formatDistance(c.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <div className="flex gap-2 items-center">
            <input
              ref={commentInputRef}
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Tulis komentar..."
              className="flex-1 text-sm px-3 py-2 bg-gray-50 rounded-xl border border-transparent focus:border-gray-200 outline-none"
            />
            <button onClick={submitComment} disabled={!commentText.trim() || submitting}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#d42b2b] text-white disabled:opacity-40 flex-shrink-0 transition-opacity">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
