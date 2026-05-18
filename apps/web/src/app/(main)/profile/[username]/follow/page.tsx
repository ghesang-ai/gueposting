"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

interface FollowUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  trustScore: number;
  isFollowing: boolean;
  followsYou: boolean;
}

type Tab = "followers" | "following";

function FollowListInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const username = params.username as string;
  const initialTab = (searchParams.get("tab") as Tab) ?? "followers";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fersRes, fingRes] = await Promise.all([
        api.get(`/users/${username}/followers`),
        api.get(`/users/${username}/following`),
      ]);
      const fersData: FollowUser[] = fersRes.data;
      const fingData: FollowUser[] = fingRes.data;
      setFollowers(fersData);
      setFollowing(fingData);

      // Init followingMap
      const map: Record<string, boolean> = {};
      [...fersData, ...fingData].forEach((u) => { map[u.id] = u.isFollowing; });
      setFollowingMap(map);
    } catch {}
    finally { setLoading(false); }
  }, [username]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFollow = async (u: FollowUser) => {
    try {
      await api.post(`/users/${u.username}/follow`);
      setFollowingMap((prev) => ({ ...prev, [u.id]: !prev[u.id] }));
    } catch {}
  };

  const list = tab === "followers" ? followers : following;

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#c0281f] px-4 pt-4 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/80 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <span className="text-white font-bold text-base flex-1">@{username}</span>
      </header>

      {/* Tabs — gaya X */}
      <div className="bg-white border-b border-gray-100 flex">
        {(["followers", "following"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-4 text-sm font-semibold transition-colors relative",
              tab === t ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {t === "followers" ? "Pengikut" : "Mengikuti"}
            {tab === t && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#d42b2b] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400 gap-2">
          <p className="text-sm font-medium">
            {tab === "followers" ? "Belum ada pengikut" : "Belum mengikuti siapapun"}
          </p>
        </div>
      ) : (
        <div className="bg-white divide-y divide-gray-50">
          {list.map((u) => (
            <div key={u.id} className="px-4 py-3.5 flex items-start gap-3">
              {/* Avatar */}
              <button onClick={() => router.push(`/profile/${u.username}`)} className="flex-shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#d42b2b] flex items-center justify-center">
                  {u.avatarUrl
                    ? <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-lg">{u.displayName[0]}</span>
                  }
                </div>
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <button onClick={() => router.push(`/profile/${u.username}`)} className="text-left w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-gray-900 truncate">{u.displayName}</span>
                    {u.trustScore >= 50 && (
                      <div className="w-4 h-4 rounded-full bg-[#1d9bf0] flex items-center justify-center flex-shrink-0">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-gray-400">@{u.username}</span>
                    {u.followsYou && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded">
                        Mengikutimu
                      </span>
                    )}
                  </div>
                  {u.bio && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-snug">{u.bio}</p>
                  )}
                </button>
              </div>

              {/* Follow button */}
              <button
                onClick={() => toggleFollow(u)}
                className={cn(
                  "flex-shrink-0 mt-0.5 px-4 py-1.5 rounded-full text-sm font-bold border transition-colors",
                  followingMap[u.id]
                    ? "border-gray-300 text-gray-700 hover:border-red-200 hover:text-red-600"
                    : "bg-gray-900 text-white border-gray-900 hover:bg-gray-700"
                )}
              >
                {followingMap[u.id] ? "Mengikuti" : "Ikuti"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FollowListPage() {
  return (
    <Suspense>
      <FollowListInner />
    </Suspense>
  );
}
