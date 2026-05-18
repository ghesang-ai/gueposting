"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Link2, Settings, ChevronRight, Heart, MessageCircle, Star, Camera, LogOut, UserPen } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  avatarPositionX?: number;
  avatarPositionY?: number;
  coverUrl: string | null;
  coverPositionY: number | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  trustScore: number;
  createdAt: string;
  _count: { posts: number; followers: number; following: number };
  isFollowing?: boolean;
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
  user: { id: string; username: string; displayName: string; avatarUrl: string | null; trustScore: number };
  gadget: { id: string; name: string; brand: string; imageUrl: string | null } | null;
}

const TABS = ["Postingan", "Review", "Diskusi", "Polling", "Simpan"] as const;
type Tab = typeof TABS[number];

function getLevel(score: number) {
  if (score >= 80) return { level: 5, label: "Master" };
  if (score >= 60) return { level: 4, label: "Expert" };
  if (score >= 40) return { level: 3, label: "Enthusiast" };
  if (score >= 20) return { level: 2, label: "Member" };
  return { level: 1, label: "Newbie" };
}

function getBadges(posts: Post[], score: number) {
  const badges = [];
  const reviews = posts.filter(p => p.type === "review").length;
  const totalLikes = posts.reduce((s, p) => s + p.likeCount, 0);
  if (reviews >= 3) badges.push({ emoji: "🏆", label: "Top Reviewer" });
  if (totalLikes >= 20) badges.push({ emoji: "👍", label: "Helpful" });
  if (score >= 30) badges.push({ emoji: "🔥", label: "Trend Setter" });
  const photos = posts.filter(p => p.type === "photo").length;
  if (photos >= 2) badges.push({ emoji: "📸", label: "Photographer" });
  if (posts.length >= 10) badges.push({ emoji: "✍️", label: "Contributor" });
  if (badges.length === 0) badges.push({ emoji: "⭐", label: "Rising Star" });
  return badges;
}

function formatJoin(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

function formatNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

export function ProfileView({ username, isOwn }: { username: string; isOwn: boolean }) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Postingan");
  const [followLoading, setFollowLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch profile first — critical
        const pRes = await api.get(`/users/${username}`);
        setProfile(pRes.data);
        setFollowing(pRes.data.isFollowing ?? false);
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message ?? err?.message ?? "unknown";
        console.error("[ProfileView] profile fetch failed:", status, msg);
        setLoadError(status ? `Error ${status}: ${msg}` : `Network error: ${msg}`);
        setLoading(false);
        return;
      }

      // Fetch posts separately — non-critical, failure won't hide the profile
      try {
        const postsRes = await api.get(`/users/${username}/posts?limit=30`);
        setPosts(postsRes.data.data ?? postsRes.data);
      } catch (err: any) {
        console.warn("[ProfileView] posts fetch failed:", err?.response?.status, err?.message);
        // leave posts as [] — profile still shows
      } finally {
        setLoading(false);
      }
    };
    if (username) load();
  }, [username]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleLogout = () => {
    setShowMenu(false);
    logout();
    router.push("/login");
  };

  const toggleFollow = async () => {
    setFollowLoading(true);
    try {
      await api.post(`/users/${username}/follow`);
      setFollowing((f) => !f);
      setProfile((p) => p ? {
        ...p,
        _count: { ...p._count, followers: p._count.followers + (following ? -1 : 1) },
      } : p);
    } catch { } finally {
      setFollowLoading(false);
    }
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === "Postingan") return true;
    if (activeTab === "Review") return p.type === "review";
    if (activeTab === "Diskusi") return p.type === "discussion";
    if (activeTab === "Polling") return false;
    return false;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f5f5f5]">
      <div className="w-8 h-8 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#f5f5f5] gap-3 px-6">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d42b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <p className="text-sm font-semibold text-gray-700">Gagal memuat profil</p>
      {loadError && (
        <p className="text-xs text-gray-400 text-center max-w-xs">{loadError}</p>
      )}
      <button
        onClick={() => window.location.reload()}
        className="mt-1 bg-[#d42b2b] text-white text-sm font-bold px-6 py-2.5 rounded-full active:scale-95 transition-transform"
      >
        Coba lagi
      </button>
    </div>
  );

  const { level, label: levelLabel } = getLevel(profile.trustScore);
  const badges = getBadges(posts, profile.trustScore);
  const kontribusi = {
    review: posts.filter(p => p.type === "review").length,
    polling: 0,
    diskusi: posts.filter(p => p.type === "discussion").length,
    komentar: 0,
  };
  const poin = Math.round(profile.trustScore * 100);

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-24">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#c0281f] px-4 pt-4 pb-3 flex items-center justify-between">
        {isOwn ? (
          <>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/gueposting-icon-light.png" alt="GP" style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: '14px' }} />
              <div className="flex flex-col leading-none">
                <span className="font-black text-white text-xl" style={{ fontFamily: "var(--font-brand)" }}>GUEPOSTING</span>
                <span className="text-white/70 font-medium" style={{ fontSize: 9 }}>Gadget User Experience, Posting &amp; Sharing</span>
              </div>
            </div>
            <div className="relative flex items-center gap-3" ref={menuRef}>
              <button onClick={() => setShowMenu((v) => !v)} className="text-white/80 hover:text-white">
                <Settings size={20} />
              </button>
              {showMenu && (
                <div className="absolute top-8 right-0 bg-white rounded-2xl shadow-xl overflow-hidden z-50 min-w-[180px]">
                  <button
                    onClick={() => { setShowMenu(false); router.push("/profile/edit"); }}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100"
                  >
                    <UserPen size={16} className="text-gray-500" />
                    Edit Profil
                  </button>
                  <div className="h-px bg-gray-100 mx-4" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-semibold text-[#d42b2b] hover:bg-red-50 active:bg-red-100"
                  >
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => router.back()} className="text-white/80 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-white font-bold text-base">@{profile.username}</span>
            <div className="w-5" />
          </>
        )}
      </header>

      {/* Cover + Avatar */}
      <div className="relative">
        {/* Cover */}
        <div className="h-36 relative overflow-hidden">
          {profile.coverUrl ? (
            <img
              src={profile.coverUrl}
              alt="cover"
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${profile.coverPositionY ?? 50}%` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#c0281f] via-[#8b0000] to-[#3d0000]">
              <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(circle at 30% 50%, rgba(255,255,255,0.07) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)"}} />
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="absolute left-4 -bottom-12">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-[#c0281f] to-[#e8453a]">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" style={{ objectPosition: `${profile.avatarPositionX ?? 50}% ${profile.avatarPositionY ?? 50}%` }} />
                : <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">{profile.displayName[0]}</div>
              }
            </div>
          </div>
        </div>

        {/* Edit Profil button */}
        {isOwn ? (
          <button
            onClick={() => router.push("/profile/edit")}
            className="absolute right-4 bottom-3 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 flex items-center gap-1.5 shadow-sm hover:bg-gray-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Profil
          </button>
        ) : (
          <button
            onClick={toggleFollow}
            disabled={followLoading}
            className={cn(
              "absolute right-4 bottom-3 rounded-full px-5 py-1.5 text-sm font-bold shadow-sm transition-colors",
              following
                ? "bg-white border-2 border-gray-200 text-gray-700 hover:border-red-200"
                : "bg-[#d42b2b] text-white hover:bg-[#b82424]"
            )}
          >
            {following ? "Mengikuti" : "Ikuti"}
          </button>
        )}
      </div>

      {/* Identity */}
      <div className="mt-14 px-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-gray-900">{profile.displayName}</span>
          {profile.trustScore >= 50 && (
            <div className="w-5 h-5 rounded-full bg-[#1d9bf0] flex items-center justify-center flex-shrink-0">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
            </div>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-0.5">@{profile.username}</p>

        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
            ⭐ Level {level}
          </span>
          <span className="text-xs text-gray-400">GUEPOSTING Member sejak {formatJoin(profile.createdAt)}</span>
        </div>

        {profile.bio && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{profile.bio}</p>
        )}

        <div className="mt-2 space-y-1">
          {profile.location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-400">
              <MapPin size={13} className="flex-shrink-0" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-1.5 text-sm text-[#d42b2b] font-medium">
              <Link2 size={13} className="flex-shrink-0" />
              <span>{profile.website.replace(/^https?:\/\//, "")}</span>
            </div>
          )}
        </div>

        {/* Following / Followers — gaya X */}
        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={() => router.push(`/profile/${profile.username}/follow?tab=following`)}
            className="flex items-center gap-1 hover:underline"
          >
            <span className="text-sm font-bold text-gray-900">{formatNum(profile._count.following)}</span>
            <span className="text-sm text-gray-400">Mengikuti</span>
          </button>
          <button
            onClick={() => router.push(`/profile/${profile.username}/follow?tab=followers`)}
            className="flex items-center gap-1 hover:underline"
          >
            <span className="text-sm font-bold text-gray-900">{formatNum(profile._count.followers)}</span>
            <span className="text-sm text-gray-400">Pengikut</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex">
          {[
            { label: "Postingan", value: formatNum(profile._count.posts) },
            { label: "Pengikut", value: formatNum(profile._count.followers) },
            { label: "Mengikuti", value: formatNum(profile._count.following) },
            { label: "Poin", value: formatNum(poin) },
          ].map(({ label, value }, i) => (
            <div key={label} className={cn("flex-1 text-center py-3", i > 0 && "border-l border-gray-100")}>
              <div className="text-base font-black text-gray-900">{value}</div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-gray-800">Badge</span>
          <button className="text-xs text-[#d42b2b] font-semibold flex items-center gap-0.5">Lihat semua <ChevronRight size={12}/></button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {badges.map((b, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex items-center justify-center text-2xl shadow-sm">
                {b.emoji}
              </div>
              <span className="text-[10px] text-gray-500 font-medium text-center w-16 leading-tight">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kontribusi */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm p-4">
        <span className="text-sm font-bold text-gray-800">Kontribusi</span>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[
            { label: "Review", value: kontribusi.review },
            { label: "Polling", value: kontribusi.polling },
            { label: "Diskusi", value: kontribusi.diskusi },
            { label: "Komentar", value: kontribusi.komentar },
          ].map(({ label, value }) => (
            <div key={label} className="text-center bg-[#f9f9f9] rounded-xl py-3">
              <div className="text-base font-black text-gray-900">{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 text-[11px] font-semibold transition-colors",
                activeTab === tab
                  ? "text-[#d42b2b] border-b-2 border-[#d42b2b] -mb-px"
                  : "text-gray-400"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-gray-300 gap-2">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            <p className="text-sm">Belum ada postingan</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {filteredPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => router.push(`/post/${post.id}`)}
                className="relative aspect-square bg-gray-100 overflow-hidden group"
              >
                {post.mediaUrls?.[0] ? (
                  <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-2">
                    <p className="text-[9px] text-gray-500 text-center line-clamp-4 leading-tight">{post.content}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                  <span className="text-white text-xs flex items-center gap-1"><Heart size={12} fill="white"/>{post.likeCount}</span>
                  <span className="text-white text-xs flex items-center gap-1"><MessageCircle size={12} fill="white"/>{post.commentCount}</span>
                </div>
                {post.type === "review" && post.rating && (
                  <div className="absolute top-1 right-1 bg-amber-400 rounded-full w-5 h-5 flex items-center justify-center">
                    <Star size={9} fill="white" className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
