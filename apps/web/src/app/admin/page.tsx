"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  Cpu,
  Ticket,
  Calendar,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  BarChart3,
  Settings,
  Check,
  X,
  MoreVertical,
} from "lucide-react";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  users: number;
  posts: number;
  gadgets: number;
  activeInvites: number;
  pendingCompares: number;
  pendingUsers: number;
}

interface ActivityDay {
  date: string;
  label: string;
  users: number;
  posts: number;
  gadgets: number;
}

interface PendingUser {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  imageUrls?: string[];
  user?: { username: string; displayName: string | null };
}

interface User {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
  status?: string;
  role?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

function getDateRangeLabel(): string {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function getInitial(name: string | null | undefined, fallback: string): string {
  return (name ?? fallback ?? "?")[0].toUpperCase();
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function ActivityLineChart({
  data,
}: {
  data: ActivityDay[];
}) {
  const W = 400, H = 160, PX = 30, PY = 20;
  const innerW = W - 2 * PX;
  const innerH = H - 2 * PY;

  if (!data.length)
    return <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />;

  const allVals = data.flatMap((d) => [d.users, d.posts, d.gadgets]);
  const maxVal = Math.max(...allVals, 1);

  const x = (i: number) => PX + (i / (data.length - 1)) * innerW;
  const y = (v: number) => PY + (1 - v / maxVal) * innerH;

  const pathStr = (key: "users" | "posts" | "gadgets") =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`)
      .join(" ");

  const gridValues = [
    0,
    Math.round(maxVal * 0.33),
    Math.round(maxVal * 0.66),
    maxVal,
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      {gridValues.map((v) => (
        <line
          key={v}
          x1={PX}
          y1={y(v)}
          x2={W - PX}
          y2={y(v)}
          stroke="#f3f4f6"
          strokeWidth={1}
        />
      ))}
      {gridValues.map((v) => (
        <text
          key={`lbl-${v}`}
          x={PX - 4}
          y={y(v) + 4}
          fontSize={9}
          fill="#9ca3af"
          textAnchor="end"
        >
          {v > 999 ? `${(v / 1000).toFixed(1)}K` : v}
        </text>
      ))}
      <path
        d={pathStr("users")}
        fill="none"
        stroke="#d42b2b"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={pathStr("posts")}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={pathStr("gadgets")}
        fill="none"
        stroke="#22c55e"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.users)} r={3} fill="#d42b2b" />
          <circle cx={x(i)} cy={y(d.posts)} r={3} fill="#3b82f6" />
          <circle cx={x(i)} cy={y(d.gadgets)} r={3} fill="#22c55e" />
        </g>
      ))}
      {data.map((d, i) => (
        <text
          key={`x-${i}`}
          x={x(i)}
          y={H - 4}
          fontSize={9}
          fill="#9ca3af"
          textAnchor="middle"
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/activity"),
      api.get("/admin/users/pending"),
      api.get("/admin/posts?page=1&limit=4"),
      api.get("/admin/users?page=1&limit=5"),
    ])
      .then(([statsRes, activityRes, pendingRes, postsRes, usersRes]) => {
        setStats(statsRes.data);
        setActivity(activityRes.data);
        setPendingUsers((pendingRes.data ?? []).slice(0, 4));
        setRecentPosts((postsRes.data?.data ?? []).slice(0, 4));
        setRecentUsers(usersRes.data?.data ?? []);
      })
      .catch(() => {});
  }, []);

  const approve = async (id: string) => {
    await api.patch(`/admin/users/${id}/approve`);
    setPendingUsers((prev) => prev.filter((u) => u.id !== id));
    setStats((prev) =>
      prev ? { ...prev, pendingUsers: prev.pendingUsers - 1 } : prev
    );
  };

  const reject = async (id: string) => {
    await api.delete(`/admin/users/${id}/reject`);
    setPendingUsers((prev) => prev.filter((u) => u.id !== id));
    setStats((prev) =>
      prev ? { ...prev, pendingUsers: prev.pendingUsers - 1 } : prev
    );
  };

  const statCards = stats
    ? [
        {
          label: "Total Pengguna",
          value: stats.users,
          icon: Users,
          bg: "bg-blue-50",
          iconColor: "text-blue-600",
          change: 8.2,
        },
        {
          label: "Total Post",
          value: stats.posts,
          icon: FileText,
          bg: "bg-green-50",
          iconColor: "text-green-600",
          change: 6.7,
        },
        {
          label: "Total Gadget",
          value: stats.gadgets,
          icon: Cpu,
          bg: "bg-purple-50",
          iconColor: "text-purple-600",
          change: 11.3,
        },
        {
          label: "Invite Aktif",
          value: stats.activeInvites,
          icon: Ticket,
          bg: "bg-amber-50",
          iconColor: "text-amber-600",
          change: 4.5,
        },
      ]
    : [];

  // Aggregate activity totals for bottom stats
  const totalUsers = activity.reduce((s, d) => s + d.users, 0);
  const totalPosts = activity.reduce((s, d) => s + d.posts, 0);
  const totalGadgets = activity.reduce((s, d) => s + d.gadgets, 0);

  return (
    <div className="p-6">
      {/* Section A: Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview platform GUEPOSTING</p>
        </div>
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white">
          <Calendar size={14} />
          {getDateRangeLabel()}
          <ChevronDown size={14} />
        </div>
      </div>

      {/* Section B: Stats cards */}
      {stats ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map(({ label, value, icon: Icon, bg, iconColor, change }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${iconColor} mb-3`}
              >
                <Icon size={18} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {value.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-green-600 font-medium">
                  +{change}%
                </span>
                <span className="text-xs text-gray-400">dari minggu lalu</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 h-32 animate-pulse shadow-sm"
            />
          ))}
        </div>
      )}

      {/* Section C: Alert banner */}
      {(stats?.pendingCompares ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
            <AlertTriangle size={16} />
            {stats!.pendingCompares} AI comparison sedang pending review
          </div>
          <button className="text-sm font-semibold text-amber-700 flex items-center gap-1">
            Lihat Sekarang <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Section D: 3-column grid */}
      <div className="grid grid-cols-12 gap-5 mb-5">
        {/* Left col: Activity Chart */}
        <div className="col-span-5 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="font-bold text-sm text-gray-900">Aktivitas Platform</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ringkasan aktivitas 7 hari terakhir
              </p>
            </div>
            <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5">
              7 Hari Terakhir <ChevronDown size={12} />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d42b2b] inline-block" />
              Pengguna
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Post
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
              Gadget
            </span>
          </div>

          <ActivityLineChart data={activity} />

          {/* Bottom stats */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
            <div>
              <p className="text-xs text-gray-500">Pengguna Baru</p>
              <p className="text-sm font-bold text-gray-900">
                +{totalUsers.toLocaleString("id-ID")}{" "}
                <span className="text-green-500 font-medium text-xs">↑9.4%</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Post Baru</p>
              <p className="text-sm font-bold text-gray-900">
                +{totalPosts.toLocaleString("id-ID")}{" "}
                <span className="text-green-500 font-medium text-xs">↑7.1%</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gadget Baru</p>
              <p className="text-sm font-bold text-gray-900">
                +{totalGadgets.toLocaleString("id-ID")}{" "}
                <span className="text-green-500 font-medium text-xs">↑12.5%</span>
              </p>
            </div>
          </div>
        </div>

        {/* Middle col: Member Approval */}
        <div className="col-span-4 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-gray-900">Persetujuan Member</h2>
              {(stats?.pendingUsers ?? 0) > 0 && (
                <span className="text-xs bg-[#d42b2b] text-white rounded-full px-1.5 min-w-[18px] text-center leading-5">
                  {stats!.pendingUsers}
                </span>
              )}
            </div>
            <Link
              href="/admin/pending"
              className="text-xs text-[#d42b2b] font-semibold hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-3">
            {pendingUsers.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                Tidak ada permintaan pending
              </p>
            ) : (
              pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {getInitial(u.displayName, u.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {u.displayName ?? u.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    <p className="text-[10px] text-gray-300">{timeAgo(u.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => approve(u.id)}
                      className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                      title="Setujui"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => reject(u.id)}
                      className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                      title="Tolak"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {pendingUsers.length > 0 && (
            <Link
              href="/admin/pending"
              className="flex items-center gap-1 text-xs text-[#d42b2b] font-semibold mt-4 hover:underline"
            >
              Lihat Semua Permintaan <ChevronRight size={12} />
            </Link>
          )}
        </div>

        {/* Right col: Post Moderation */}
        <div className="col-span-3 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-gray-900">Moderasi Post</h2>
              {recentPosts.length > 0 && (
                <span className="text-xs bg-[#d42b2b] text-white rounded-full px-1.5 min-w-[18px] text-center leading-5">
                  {recentPosts.length}
                </span>
              )}
            </div>
            <Link
              href="/admin/posts"
              className="text-xs text-[#d42b2b] font-semibold hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="space-y-3">
            {recentPosts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                Tidak ada post
              </p>
            ) : (
              recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {post.imageUrls && post.imageUrls.length > 0 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.imageUrls[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {post.content?.slice(0, 30) || "(tanpa teks)"}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Oleh {post.user?.username ?? "unknown"}
                    </p>
                    <p className="text-[10px] text-gray-300">{timeAgo(post.createdAt)}</p>
                    <span className="inline-block mt-1 text-[10px] bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-full px-1.5 py-0.5">
                      Menunggu
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/admin/posts"
            className="flex items-center gap-1 text-xs text-[#d42b2b] font-semibold mt-4 hover:underline"
          >
            Lihat Semua Post <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* Section E: Bottom 2-column row */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left: Recent Users table */}
        <div className="col-span-8 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-sm text-gray-900">Pengguna Terbaru</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Pengguna yang baru bergabung ke platform
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-[#d42b2b] font-semibold hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["Nama", "Email", "Bergabung", "Status", "Aksi"].map((col) => (
                  <th
                    key={col}
                    className="text-left text-xs text-gray-400 font-medium pb-2 pr-3"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-xs text-gray-400 py-8">
                    Memuat data...
                  </td>
                </tr>
              ) : (
                recentUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitial(u.displayName, u.username)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                          {u.displayName ?? u.username}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-gray-500 truncate max-w-[140px]">
                      {u.email ?? "-"}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 pr-3">
                      {u.status === "pending" ? (
                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5">
                          Pending
                        </span>
                      ) : (
                        <span className="text-[10px] bg-green-50 text-green-600 border border-green-200 rounded-full px-2 py-0.5">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right: Quick Actions */}
        <div className="col-span-4 bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-sm text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: Ticket,
                label: "Buat Invite Code",
                sub: "Buat kode undangan baru",
                href: "/admin/invites",
                iconBg: "bg-red-50",
                iconColor: "text-[#d42b2b]",
              },
              {
                icon: Cpu,
                label: "Kelola Gadget",
                sub: "Tambah atau edit gadget",
                href: "/admin/gadgets",
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                icon: BarChart3,
                label: "Laporan Platform",
                sub: "Lihat statistik lengkap",
                href: "/admin/trending",
                iconBg: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                icon: Settings,
                label: "Pengaturan",
                sub: "Atur preferensi admin",
                href: "#",
                iconBg: "bg-gray-50",
                iconColor: "text-gray-500",
              },
            ].map(({ icon: Icon, label, sub, href, iconBg, iconColor }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col gap-2 p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} ${iconColor}`}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 leading-tight">
                    {label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
