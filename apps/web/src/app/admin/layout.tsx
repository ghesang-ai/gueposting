"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth";
import {
  LayoutDashboard,
  UserCheck,
  ShieldCheck,
  Users,
  Ticket,
  Cpu,
  Flame,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  Bell,
  BookOpen,
} from "lucide-react";
import { api } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badgeKey?: "pendingUsers";
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/pending", label: "Persetujuan Member", icon: UserCheck, badgeKey: "pendingUsers" },
  { href: "/admin/posts", label: "Moderasi Post", icon: ShieldCheck },
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/invites", label: "Invite Code", icon: Ticket },
  { href: "/admin/gadgets", label: "Kelola Gadget", icon: Cpu },
  { href: "/admin/trending", label: "Gadget Trending", icon: Flame },
  { href: "/admin/reports", label: "Laporan", icon: BarChart3 },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

const pathLabelMap: Record<string, string> = {
  "/admin": "Dashboard / Overview",
  "/admin/pending": "Persetujuan Member",
  "/admin/posts": "Moderasi Post",
  "/admin/users": "Pengguna",
  "/admin/invites": "Invite Code",
  "/admin/gadgets": "Kelola Gadget",
  "/admin/trending": "Gadget Trending",
  "/admin/reports": "Laporan",
  "/admin/settings": "Pengaturan",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, logout, _hasHydrated } = useAuthStore();
  const [pendingUsers, setPendingUsers] = useState(0);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user && user.role !== "admin") router.push("/feed");
  }, [token, user, router, _hasHydrated]);

  useEffect(() => {
    if (!token) return;
    api.get("/admin/stats").then((r) => {
      setPendingUsers(r.data?.pendingUsers ?? 0);
    }).catch(() => {});
  }, [token]);

  if (!_hasHydrated || !user || user.role !== "admin") return null;

  const breadcrumb = pathLabelMap[pathname] ?? "Admin";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 fixed left-0 top-0 bottom-0 bg-white border-r border-gray-100 flex flex-col z-40">
        {/* Red top section */}
        <div className="bg-[#d42b2b] px-5 py-4 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gueposting-icon-light.png" alt="GP" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          <div className="flex flex-col leading-none">
            <span className="font-black text-white text-base" style={{ fontFamily: "var(--font-brand)" }}>GUEPOSTING</span>
            <span className="text-white/60 font-medium" style={{ fontSize: 8 }}>Gadget User Experience, Posting & Sharing</span>
          </div>
          <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">ADMIN</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {navItems.map(({ href, label, icon: Icon, exact, badgeKey }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            const badgeCount = badgeKey === "pendingUsers" ? pendingUsers : 0;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-red-50 text-[#d42b2b] font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                {badgeCount > 0 && (
                  <span className="text-xs bg-[#d42b2b] text-white rounded-full px-1.5 min-w-[18px] text-center leading-5">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Promo card */}
        <div className="mx-3 mb-3 bg-red-50 rounded-2xl p-4">
          <p className="font-bold text-sm text-gray-900">Kelola komunitas</p>
          <p className="text-xs text-gray-500 mt-1">Pastikan komunitas tetap aman, aktif dan terpercaya.</p>
          <button className="bg-[#d42b2b] text-white text-xs font-semibold py-2 rounded-xl mt-3 w-full flex items-center justify-center gap-1">
            <BookOpen size={12} />
            Panduan Admin
          </button>
        </div>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 w-full transition-colors"
          >
            <ChevronLeft size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="ml-64 min-h-screen flex flex-col bg-gray-50 flex-1">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-30">
          <Menu size={20} className="text-gray-400" />
          <span className="text-sm text-gray-400">{breadcrumb}</span>
          <div className="flex-1" />
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-72 text-sm text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <span>Cari...</span>
          </div>
          {/* Bell */}
          <div className="relative">
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100">
              <Bell size={17} />
            </button>
            {pendingUsers > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#d42b2b] text-white text-[9px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-bold">
                {pendingUsers}
              </span>
            )}
          </div>
          {/* Admin avatar */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#d42b2b] text-white flex items-center justify-center text-sm font-bold">
              A
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-800">Admin GUEPOSTING</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
