"use client";

import { useState } from "react";
import { Settings, Bell, Shield, Globe, Palette, Info } from "lucide-react";

interface SettingSection {
  icon: React.ElementType;
  title: string;
  description: string;
  items: { label: string; description: string; value: string }[];
}

const sections: SettingSection[] = [
  {
    icon: Globe,
    title: "Platform",
    description: "Konfigurasi umum platform GUEPOSTING",
    items: [
      { label: "Nama Platform", description: "Nama yang ditampilkan ke pengguna", value: "GUEPOSTING" },
      { label: "Mode Registrasi", description: "Pengguna baru hanya bisa daftar via invite code", value: "Invite Only" },
      { label: "Persetujuan Admin", description: "Akun baru perlu disetujui admin sebelum aktif", value: "Aktif" },
    ],
  },
  {
    icon: Shield,
    title: "Keamanan",
    description: "Pengaturan keamanan dan autentikasi",
    items: [
      { label: "JWT Expiry", description: "Durasi token login pengguna", value: "7 hari" },
      { label: "Password Hashing", description: "Algoritma hash yang digunakan", value: "bcrypt (rounds: 10)" },
      { label: "Rate Limiting", description: "Batas request per IP", value: "100 req/menit" },
    ],
  },
  {
    icon: Bell,
    title: "Notifikasi",
    description: "Pengaturan sistem notifikasi platform",
    items: [
      { label: "WebSocket", description: "Notifikasi real-time via WebSocket", value: "Aktif" },
      { label: "Event Triggers", description: "Trigger notifikasi: like, comment, follow", value: "Aktif" },
    ],
  },
  {
    icon: Palette,
    title: "Tampilan",
    description: "Konfigurasi tampilan dan tema platform",
    items: [
      { label: "Warna Utama", description: "Warna brand platform", value: "#d42b2b" },
      { label: "Font Brand", description: "Font yang digunakan untuk nama brand", value: "Custom (GUEPOSTING)" },
      { label: "Gadget Trending", description: "Maksimal gadget yang ditampilkan di trending", value: "6 gadget" },
    ],
  },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-sm text-gray-500 mt-1">Konfigurasi dan informasi sistem GUEPOSTING</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Pengaturan sistem dikonfigurasi melalui environment variables di Railway dan Vercel.
          Halaman ini menampilkan konfigurasi aktif yang sedang berjalan.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {sections.map(({ icon: Icon, title }, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                activeSection === i
                  ? "bg-red-50 text-[#d42b2b] font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={15} />
              {title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {sections.map(({ icon: Icon, title, description, items }, i) => (
            <div key={i} className={activeSection === i ? "block" : "hidden"}>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                    <Icon size={16} className="text-[#d42b2b]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((item, j) => (
                    <div key={j} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                      <span className="text-sm text-gray-700 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg font-medium flex-shrink-0">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
