"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, FileText, Cpu, TrendingUp, Calendar } from "lucide-react";
import { api } from "@/lib/api";

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

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString("id-ID")}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats"),
      api.get("/admin/activity"),
    ]).then(([statsRes, activityRes]) => {
      setStats(statsRes.data);
      setActivity(activityRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const maxPosts = Math.max(...activity.map((d) => d.posts), 1);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-sm text-gray-500 mt-1">Statistik dan aktivitas platform GUEPOSTING</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse">
              <div className="h-full bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Total Pengguna" value={stats.users} color="bg-blue-500" />
          <StatCard icon={FileText} label="Total Post" value={stats.posts} color="bg-green-500" />
          <StatCard icon={Cpu} label="Total Gadget" value={stats.gadgets} color="bg-purple-500" />
          <StatCard icon={TrendingUp} label="Menunggu Persetujuan" value={stats.pendingUsers} color="bg-orange-500" />
          <StatCard icon={BarChart3} label="AI Compare Pending" value={stats.pendingCompares} color="bg-red-500" />
          <StatCard icon={Calendar} label="Invite Aktif" value={stats.activeInvites} color="bg-teal-500" />
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">Aktivitas 7 Hari Terakhir</h2>
        <p className="text-xs text-gray-400 mb-6">Post baru per hari</p>

        {loading ? (
          <div className="h-40 animate-pulse bg-gray-50 rounded-xl" />
        ) : (
          <div className="flex items-end gap-3 h-40">
            {activity.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-500 font-medium">{day.posts}</span>
                <div
                  className="w-full bg-[#d42b2b] rounded-t-lg transition-all"
                  style={{ height: `${Math.max((day.posts / maxPosts) * 120, day.posts > 0 ? 8 : 2)}px` }}
                />
                <span className="text-[10px] text-gray-400 text-center">{day.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && activity.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Detail Harian</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengguna Baru</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Post Baru</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Gadget Baru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activity.map((day) => (
                <tr key={day.date} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 text-gray-700">{day.label}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{day.users}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{day.posts}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{day.gadgets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
