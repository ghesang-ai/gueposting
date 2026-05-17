"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Home, Compass, PlusCircle, Users, User, Bell, Search,
  Heart, MessageCircle, Bookmark, Share2, Settings, Mail,
  Lock, Eye, LayoutDashboard, UserCheck, ShieldCheck, Cpu,
  Flame, BarChart3, Ticket, ChevronLeft, BookOpen, Menu,
  ArrowLeft, Camera, Star,
} from "lucide-react";

// ── Shared mock data ────────────────────────────────────────────────────────

const LOGO_WIDE = "/gueposting-logo-wide.png";
const LOGO_VERTICAL = "/gueposting-logo-vertical.png";
const LOGO_STACKED = "/gueposting-logo-stacked.png";
const ICON_LIGHT = "/gueposting-icon-light.png";
const ICON_RED = "/gueposting-icon-red.png";
const RED = "#d42b2b";

const pages = [
  "Brand Assets",
  "Login",
  "Register",
  "Feed",
  "Profile",
  "Buat Post",
  "Admin Dashboard",
];

// ── Brand Assets ─────────────────────────────────────────────────────────────
function BrandAssetsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Assets — GUEPOSTING</h2>
      <p className="text-gray-500 text-sm mb-8">Gadget User Experience, Posting &amp; Sharing</p>

      {/* Logo variants */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-3 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Logo Vertikal (White BG)</p>
          <Image src={LOGO_VERTICAL} alt="GUEPOSTING Vertical" width={300} height={200} className="object-contain" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-3 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Logo Stacked (White BG)</p>
          <Image src={LOGO_STACKED} alt="GUEPOSTING Stacked" width={400} height={200} className="object-contain" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-3 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Logo Wide (White BG)</p>
          <Image src={LOGO_WIDE} alt="GUEPOSTING Wide" width={500} height={150} className="object-contain" />
        </div>
      </div>

      {/* Icons */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-3">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">App Icon — Light</p>
          <Image src={ICON_LIGHT} alt="Icon Light" width={120} height={120} className="object-contain" />
        </div>
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-3">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">App Icon — Red</p>
          <Image src={ICON_RED} alt="Icon Red" width={120} height={120} className="object-contain" />
        </div>
      </div>

      {/* Color palette */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-4">Color Palette</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { name: "Primary Red", hex: "#d42b2b" },
            { name: "Dark Red", hex: "#c0281f" },
            { name: "Light Red", hex: "#fde8e8" },
            { name: "Black", hex: "#111111" },
            { name: "Gray 900", hex: "#111827" },
            { name: "Gray 500", hex: "#6b7280" },
            { name: "Gray 100", hex: "#f3f4f6" },
            { name: "White", hex: "#ffffff" },
          ].map(c => (
            <div key={c.hex} className="flex flex-col gap-2">
              <div className="h-12 rounded-xl border border-gray-100" style={{ backgroundColor: c.hex }} />
              <div>
                <p className="text-xs font-semibold text-gray-700">{c.name}</p>
                <p className="text-xs text-gray-400">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Login ────────────────────────────────────────────────────────────────────
function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto">
      {/* Hero */}
      <div className="relative flex items-start justify-between mb-8">
        <div className="flex-1 pt-2 z-10">
          <div
            className="mb-5 overflow-hidden"
            style={{
              width: 300,
              height: 78,
              backgroundImage: `url(${LOGO_WIDE})`,
              backgroundSize: "auto 78px",
              backgroundPosition: "-13px center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Selamat datang<br />di{" "}
            <span style={{ fontFamily: "var(--font-brand)", color: RED, backgroundColor: "transparent" }}>GUEPOSTING</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-[200px]">
            Masuk untuk berbagi dan menemukan hal terbaik seputar gadget.
          </p>
        </div>
        <div className="relative w-44 h-44 flex-shrink-0 -mr-2">
          <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 60% 40%, #ffd6d6 0%, #ffecec 60%, transparent 100%)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl drop-shadow-sm" style={{ marginLeft: 16, marginTop: 8 }}>📱</span>
            <span className="absolute bottom-5 right-3 text-4xl drop-shadow-sm">🎧</span>
            <span className="absolute top-4 right-5 text-3xl drop-shadow-sm">⌚</span>
          </div>
          <div className="absolute top-2 left-6 bg-white rounded-full w-9 h-9 shadow-md flex items-center justify-center text-lg">❤️</div>
          <div className="absolute bottom-6 left-2 bg-white rounded-full w-8 h-8 shadow-md flex items-center justify-center text-base">🔥</div>
          <div className="absolute bottom-2 right-10 bg-white rounded-full w-8 h-8 shadow-md flex items-center justify-center text-base">👍</div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4 flex-1">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Email</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Mail size={16} style={{ color: RED }} />
            </div>
            <input type="email" placeholder="kamu@email.com" className="w-full pl-14 pr-4 py-3.5 rounded-2xl border border-gray-200 text-sm outline-none bg-white text-gray-900 placeholder:text-gray-400" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <span className="text-xs font-semibold" style={{ color: RED }}>Lupa password?</span>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Lock size={16} style={{ color: RED }} />
            </div>
            <input type={showPw ? "text" : "password"} placeholder="••••••••" className="w-full pl-14 pr-12 py-3.5 rounded-2xl border border-gray-200 text-sm outline-none bg-white text-gray-900" />
            <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Eye size={18} />
            </button>
          </div>
        </div>
        <button className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg" style={{ backgroundColor: RED }}>
          Masuk
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">atau masuk dengan</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Social */}
      <div className="mb-6">
        <button className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5.1l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7l-6.5 5C9.6 39.7 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.2C40.6 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
          <span className="text-sm font-semibold text-gray-700">Masuk dengan Google</span>
        </button>
      </div>

      {/* Trust badge */}
      <div className="flex items-center gap-4 bg-red-50/60 border border-red-100 rounded-2xl px-4 py-3 mb-6">
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
          <Image src={ICON_LIGHT} alt="GP" width={28} height={28} className="object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">Aman &amp; Terpercaya</p>
          <p className="text-xs text-gray-500 mt-0.5">Data kamu aman bersama GUEPOSTING.</p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">
        Belum punya akun?{" "}
        <span className="font-bold" style={{ color: RED }}>Daftar Sekarang</span>
      </p>
    </div>
  );
}

// ── Register ─────────────────────────────────────────────────────────────────
function RegisterPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-2/5 flex-col justify-between p-10" style={{ backgroundColor: RED }}>
        <div>
          {/* Logo dalam card putih agar terlihat di background merah */}
          <div className="bg-white rounded-2xl px-5 py-4 inline-flex items-center gap-3 mb-10 shadow-sm">
            <Image src={ICON_LIGHT} alt="GP" width={36} height={36} className="object-contain" />
            <span className="font-black text-xl tracking-tight" style={{ fontFamily: "var(--font-brand)", color: RED }}>GUEPOSTING</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-snug">Bergabung dengan komunitas gadget terbesar di Indonesia</h2>
          <p className="text-red-200 mt-4 text-sm leading-relaxed">Review jujur, foto unboxing, diskusi seru — semua ada di GUEPOSTING.</p>
        </div>
        <div className="flex gap-2">
          {["📱", "🎧", "⌚", "💻", "🎮"].map(e => (
            <div key={e} className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-lg">{e}</div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-10">
        <div className="max-w-sm w-full mx-auto">
          <div className="lg:hidden mb-8">
            <div
              className="overflow-hidden"
              style={{
                width: 300,
                height: 78,
                backgroundImage: `url(${LOGO_WIDE})`,
                backgroundSize: "auto 78px",
                backgroundPosition: "-13px center",
                backgroundRepeat: "no-repeat",
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Buat Akun</h1>
          <p className="text-sm text-gray-500 mb-6">Sudah punya akun? <span className="font-semibold" style={{ color: RED }}>Masuk</span></p>

          <div className="space-y-4">
            {[["Nama Lengkap", "text", "John Doe"], ["Username", "text", "@username"], ["Email", "email", "kamu@email.com"], ["Password", "password", "••••••••"]].map(([label, type, placeholder]) => (
              <div key={label as string}>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">{label as string}</label>
                <input type={type as string} placeholder={placeholder as string} className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none bg-white" />
              </div>
            ))}
            <button className="w-full py-3.5 rounded-2xl font-bold text-white text-sm" style={{ backgroundColor: RED }}>
              Daftar Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feed ─────────────────────────────────────────────────────────────────────
const mockPosts = [
  { id: 1, user: "gadgetlover", displayName: "Gadget Lover", time: "2 jam lalu", content: "Review iPhone 15 Pro setelah 3 bulan pakai — kamera nya makin keren banget buat foto macro!", likes: 142, comments: 28, bookmarks: 15, tag: "Review" },
  { id: 2, user: "techid", displayName: "Tech Indonesia", time: "5 jam lalu", content: "Unboxing Samsung Galaxy S25 Ultra! Stylus bawaan nya terasa lebih responsif dari sebelumnya 🔥", likes: 89, comments: 14, bookmarks: 32, tag: "Unboxing" },
];

function FeedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Image src={ICON_LIGHT} alt="GP" width={32} height={32} className="object-contain" />
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 flex items-center gap-2">
            <Search size={14} className="text-gray-400" />
            <span className="text-sm text-gray-400">Cari di GUEPOSTING...</span>
          </div>
          <div className="relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold" style={{ backgroundColor: RED }}>3</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-bold" style={{ color: RED }}>G</div>
        </div>
      </header>

      {/* Stories */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-4 overflow-x-auto">
          {["📱 iPhone", "🎧 Audio", "⌚ Watch", "💻 Laptop", "🎮 Gaming"].map(s => (
            <div key={s} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl bg-red-50" style={{ borderColor: RED }}>
                {s.split(" ")[0]}
              </div>
              <span className="text-xs text-gray-500">{s.split(" ")[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {mockPosts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: RED }}>
                  {post.displayName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{post.displayName}</p>
                  <p className="text-xs text-gray-400">@{post.user} · {post.time}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#fde8e8", color: RED }}>{post.tag}</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed">{post.content}</p>
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mt-3 flex items-center justify-center text-gray-300">
                <span className="text-4xl">📷</span>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-50 flex items-center gap-5">
              {[{ icon: Heart, count: post.likes, color: RED }, { icon: MessageCircle, count: post.comments, color: "#6b7280" }, { icon: Bookmark, count: post.bookmarks, color: "#6b7280" }].map(({ icon: Icon, count, color }, i) => (
                <button key={i} className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
                  <Icon size={16} />
                  {count}
                </button>
              ))}
              <div className="flex-1" />
              <button className="text-gray-400"><Share2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-16 flex items-center justify-around px-4">
        {[{ icon: Home, label: "Beranda", active: true }, { icon: Compass, label: "Jelajah" }, { icon: PlusCircle, label: "", fab: true }, { icon: Users, label: "Komunitas" }, { icon: User, label: "Profil" }].map((item, i) => (
          <button key={i} className="flex flex-col items-center gap-1">
            {item.fab ? (
              <div className="w-12 h-12 rounded-full flex items-center justify-center -mt-5 shadow-lg" style={{ backgroundColor: RED }}>
                <PlusCircle size={24} color="white" />
              </div>
            ) : (
              <>
                <item.icon size={22} color={item.active ? RED : "#9ca3af"} />
                {item.label && <span className="text-[10px] font-semibold" style={{ color: item.active ? RED : "#9ca3af" }}>{item.label}</span>}
              </>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Profile ──────────────────────────────────────────────────────────────────
function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      {/* Cover */}
      <div className="relative h-40 bg-gradient-to-r from-red-700 to-red-500">
        <div className="absolute top-3 right-3 w-9 h-9 bg-black/30 rounded-full flex items-center justify-center">
          <Settings size={18} color="white" />
        </div>
        <div className="absolute -bottom-10 left-4 w-20 h-20 rounded-full border-4 border-white flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: RED }}>G</div>
        <div className="absolute -bottom-9 right-4 border rounded-full px-4 py-1.5 bg-white text-sm font-semibold" style={{ color: RED, borderColor: RED }}>Edit Profil</div>
      </div>
      <div className="pt-14 px-4 pb-4 bg-white">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xl font-extrabold text-gray-900">Ghesang Pratano</p>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-0.5 rounded-full">⭐ Level 3</span>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">@ghesangpratano</p>
        <p className="text-gray-400 text-xs mt-2">GUEPOSTING Member sejak Januari 2025</p>
      </div>

      {/* Stats */}
      <div className="bg-white mx-4 mt-3 rounded-2xl shadow-sm grid grid-cols-4">
        {[["12", "Postingan"], ["234", "Pengikut"], ["89", "Mengikuti"], ["450", "Poin"]].map(([val, label]) => (
          <div key={label} className="flex flex-col items-center py-4">
            <p className="text-lg font-extrabold text-gray-900">{val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Badge */}
      <div className="bg-white mx-4 mt-3 rounded-2xl shadow-sm p-4">
        <p className="text-sm font-bold text-gray-900 mb-3">Badge</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl">⭐</span>
          <div>
            <p className="text-sm font-bold text-gray-900">Rising Star</p>
            <p className="text-xs text-gray-500">Aktif berkontribusi di komunitas</p>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div className="mx-4 mt-3 mb-8">
        <p className="text-sm font-bold mb-3" style={{ color: RED }}>Postingan</p>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center text-3xl">
              {["📱", "🎧", "💻", "⌚"][i]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Buat Post ────────────────────────────────────────────────────────────────
function BuatPostPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, #c0281f, ${RED})` }}>
        <div className="flex items-center gap-3">
          <ArrowLeft size={22} color="white" />
          <p className="text-white font-bold text-lg">Buat Postingan</p>
        </div>
        <button className="bg-white text-sm font-bold px-5 py-2 rounded-full" style={{ color: RED }}>Post</button>
      </header>

      <div className="p-4 space-y-4">
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: RED }}>G</div>
          <div>
            <p className="font-semibold text-sm text-gray-900">Ghesang Pratano</p>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Publik</span>
          </div>
        </div>

        {/* Post types */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["⭐ Review", "📷 Foto", "🎬 Video", "💬 Diskusi"].map((t, i) => (
            <button key={t} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${i === 0 ? "text-white border-transparent" : "text-gray-500 border-gray-200 bg-white"}`} style={i === 0 ? { backgroundColor: RED } : {}}>
              {t}
            </button>
          ))}
        </div>

        {/* Gadget picker */}
        <div className="bg-red-50 rounded-2xl p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Gadget yang dibahas</p>
          <div className="flex gap-2">
            {["iPhone 15 Pro", "Galaxy S25", "Pixel 9"].map(g => (
              <div key={g} className="bg-white rounded-xl px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200">{g}</div>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <textarea className="w-full border-0 outline-none resize-none text-sm text-gray-800 min-h-[120px] placeholder:text-gray-400" placeholder="Ceritakan pengalaman gadget kamu..." />

        {/* Rating */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-700">Rating:</p>
          <div className="flex gap-1">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 8 ? "text-white" : "bg-gray-100 text-gray-400"}`} style={i < 8 ? { backgroundColor: RED } : {}}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Topics */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Topik</p>
          <div className="flex flex-wrap gap-2">
            {["#Review", "#Unboxing", "#Tips&Trik", "#Diskusi", "#Event"].map((tag, i) => (
              <span key={tag} className={`px-3 py-1 rounded-full text-xs font-semibold border ${i < 2 ? "text-white border-transparent" : "text-gray-500 border-gray-200"}`} style={i < 2 ? { backgroundColor: RED } : {}}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* AI stub */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
          <p className="text-sm font-bold text-purple-800">✨ AI Writing Assistant</p>
          <p className="text-xs text-purple-600 mt-1">Biarkan AI membantu memperbaiki tulisan kamu</p>
          <button className="mt-3 bg-purple-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">Improve Writing</button>
        </div>
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-4 py-4 flex items-center gap-2" style={{ backgroundColor: RED }}>
          <Image src={ICON_LIGHT} alt="GP" width={28} height={28} className="object-contain" />
          <div>
            <p className="font-bold text-white text-sm">GUEPOSTING</p>
            <span className="bg-white/20 text-white text-[9px] px-1.5 rounded font-medium">ADMIN</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {[
            [LayoutDashboard, "Dashboard", true],
            [UserCheck, "Persetujuan Member", false, 5],
            [ShieldCheck, "Moderasi Post", false],
            [Users, "Pengguna", false],
            [Ticket, "Invite Code", false],
            [Cpu, "Kelola Gadget", false],
            [Flame, "Gadget Trending", false],
            [BarChart3, "Laporan", false],
            [Settings, "Pengaturan", false],
          ].map(([Icon, label, active, badge]: any) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer ${active ? "bg-red-50 font-semibold" : "text-gray-600 hover:bg-gray-50"}`} style={active ? { color: RED } : {}}>
              <Icon size={14} />
              <span className="flex-1">{label}</span>
              {badge && <span className="text-[10px] text-white rounded-full px-1.5 min-w-[16px] text-center" style={{ backgroundColor: RED }}>{badge}</span>}
            </div>
          ))}
        </nav>
        <div className="mx-3 mb-3 bg-red-50 rounded-xl p-3">
          <p className="text-xs font-bold text-gray-900">Kelola komunitas</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Pastikan komunitas tetap aman dan terpercaya.</p>
          <button className="mt-2 w-full text-[10px] font-bold text-white rounded-lg py-1.5 flex items-center justify-center gap-1" style={{ backgroundColor: RED }}>
            <BookOpen size={10} /> Panduan Admin
          </button>
        </div>
        <div className="px-3 pb-3 border-t border-gray-100 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
            <ChevronLeft size={14} />
            Keluar
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-3">
          <Menu size={18} className="text-gray-400" />
          <span className="text-xs text-gray-400">Dashboard / Overview</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 w-56 text-xs text-gray-400">
            <Search size={12} />
            <span>Cari pengguna, post, gadget...</span>
          </div>
          <div className="relative">
            <Bell size={18} className="text-gray-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[8px] flex items-center justify-center font-bold" style={{ backgroundColor: RED }}>5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: RED }}>A</div>
            <div>
              <p className="text-xs font-semibold text-gray-800">Admin</p>
              <p className="text-[10px] text-gray-400">Super Admin</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs text-gray-500">Overview platform GUEPOSTING</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {[
              { label: "Total Pengguna", value: "12.456", icon: Users, bg: "bg-blue-50", color: "text-blue-600", change: "+8.2%" },
              { label: "Total Post", value: "3.247", icon: Star, bg: "bg-green-50", color: "text-green-600", change: "+6.7%" },
              { label: "Total Gadget", value: "1.024", icon: Cpu, bg: "bg-purple-50", color: "text-purple-600", change: "+11.3%" },
              { label: "Invite Aktif", value: "320", icon: Ticket, bg: "bg-amber-50", color: "text-amber-600", change: "+4.5%" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
                <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                  <s.icon size={16} />
                </div>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                <p className="text-xs text-green-600 font-medium mt-1">{s.change} dari minggu lalu</p>
              </div>
            ))}
          </div>

          {/* 3-col */}
          <div className="grid grid-cols-12 gap-4">
            {/* Chart placeholder */}
            <div className="col-span-5 bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-1">Aktivitas Platform</p>
              <p className="text-xs text-gray-400 mb-4">Ringkasan 7 hari terakhir</p>
              <div className="h-32 bg-gradient-to-b from-red-50 to-white rounded-xl flex items-end justify-around px-3 pb-3 gap-2">
                {[60, 75, 65, 80, 55, 85, 70].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%`, backgroundColor: i === 5 ? RED : "#fde8e8" }} />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map(d => (
                  <span key={d} className="text-[9px] text-gray-400 flex-1 text-center">{d}</span>
                ))}
              </div>
            </div>

            {/* Approval */}
            <div className="col-span-4 bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">Persetujuan Member</p>
                <span className="text-[10px] text-white px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: RED }}>5</span>
              </div>
              <div className="space-y-3">
                {["Rudi Hermawan", "Siti Nurhaliza", "Andi Pratama"].map(name => (
                  <div key={name} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold flex-shrink-0" style={{ backgroundColor: RED }}>{name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                      <p className="text-[10px] text-gray-400">5 menit lalu</p>
                    </div>
                    <button className="w-6 h-6 rounded-full border-2 border-green-400 flex items-center justify-center text-green-500">✓</button>
                    <button className="w-6 h-6 rounded-full border-2 border-red-300 flex items-center justify-center text-red-400">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Moderation */}
            <div className="col-span-3 bg-white rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-3">Moderasi Post</p>
              <div className="space-y-3">
                {["Review iPhone 15 Pro...", "Laptop terbaik 2025...", "Kamera mirrorless..."].map(title => (
                  <div key={title} className="flex gap-2 items-start">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-sm">📱</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{title}</p>
                      <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Menunggu</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Preview ──────────────────────────────────────────────────────────────
export default function BrandPreviewPage() {
  const [active, setActive] = useState(0);

  const renders: Record<string, React.ReactNode> = {
    "Brand Assets": <BrandAssetsPage />,
    "Login": <LoginPage />,
    "Register": <RegisterPage />,
    "Feed": <FeedPage />,
    "Profile": <ProfilePage />,
    "Buat Post": <BuatPostPage />,
    "Admin Dashboard": <AdminPage />,
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Preview bar */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-2 flex-shrink-0 mr-4">
            <Image src="/gueposting-icon-light.png" alt="GP" width={24} height={24} className="object-contain" />
            <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-brand)" }}>GUEPOSTING</span>
            <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Preview</span>
          </div>
          {pages.map((p, i) => (
            <button
              key={p}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${active === i ? "text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-700"}`}
              style={active === i ? { backgroundColor: RED } : {}}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full bg-white">
          {renders[pages[active]]}
        </div>
      </div>
    </div>
  );
}
