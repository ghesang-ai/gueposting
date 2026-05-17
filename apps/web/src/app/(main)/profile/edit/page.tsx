"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Link2, Camera, ChevronRight, Plus, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

interface SocialLink { platform: string; value: string; icon: string; color: string; placeholder: string }

const SOCIAL_PLATFORMS: SocialLink[] = [
  { platform: "Instagram",  value: "", icon: "📸", color: "#e1306c", placeholder: "username" },
  { platform: "YouTube",    value: "", icon: "▶️", color: "#ff0000", placeholder: "channel name" },
  { platform: "TikTok",     value: "", icon: "🎵", color: "#000000", placeholder: "@username" },
  { platform: "X (Twitter)",value: "", icon: "𝕏",  color: "#000000", placeholder: "@username" },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser, token, _hasHydrated } = useAuthStore();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPositionX, setAvatarPositionX] = useState(50);
  const [avatarPositionY, setAvatarPositionY] = useState(50);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverPositionY, setCoverPositionY] = useState(50);
  const coverRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ dragging: boolean; startY: number; startPos: number } | null>(null);
  const avatarDragState = useRef<{ dragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const [socialLinks, setSocialLinks] = useState(SOCIAL_PLATFORMS);
  const [showOnline, setShowOnline] = useState(true);
  const [allowMessages, setAllowMessages] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<"avatar" | "cover" | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) { router.push("/login"); return; }
    if (user) {
      setDisplayName(user.displayName ?? "");
      setBio((user as any).bio ?? "");
      setLocation((user as any).location ?? "");
      setWebsite((user as any).website ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
      setAvatarPositionX((user as any).avatarPositionX ?? 50);
      setAvatarPositionY((user as any).avatarPositionY ?? 50);
      setCoverUrl((user as any).coverUrl ?? "");
      setCoverPositionY((user as any).coverPositionY ?? 50);
    }
  }, [user, token, _hasHydrated]);

  const handleCoverDragStart = useCallback((clientY: number) => {
    dragState.current = { dragging: true, startY: clientY, startPos: coverPositionY };
  }, [coverPositionY]);

  const handleCoverDragMove = useCallback((clientY: number, containerHeight: number) => {
    if (!dragState.current?.dragging) return;
    const deltaY = clientY - dragState.current.startY;
    // Moving down -> image shifts up -> positionY decreases
    const deltaPct = (deltaY / containerHeight) * 100;
    const newPos = Math.min(100, Math.max(0, dragState.current.startPos - deltaPct));
    setCoverPositionY(newPos);
  }, []);

  const handleCoverDragEnd = useCallback(() => {
    if (dragState.current) {
      dragState.current.dragging = false;
    }
  }, []);

  const handleAvatarDragStart = useCallback((clientX: number, clientY: number) => {
    avatarDragState.current = { dragging: true, startX: clientX, startY: clientY, startPosX: avatarPositionX, startPosY: avatarPositionY };
  }, [avatarPositionX, avatarPositionY]);

  const handleAvatarDragMove = useCallback((clientX: number, clientY: number, containerWidth: number, containerHeight: number) => {
    if (!avatarDragState.current?.dragging) return;
    const deltaX = clientX - avatarDragState.current.startX;
    const deltaY = clientY - avatarDragState.current.startY;
    const deltaPctX = (deltaX / containerWidth) * 100;
    const deltaPctY = (deltaY / containerHeight) * 100;
    const newPosX = Math.min(100, Math.max(0, avatarDragState.current.startPosX + deltaPctX));
    const newPosY = Math.min(100, Math.max(0, avatarDragState.current.startPosY + deltaPctY));
    setAvatarPositionX(newPosX);
    setAvatarPositionY(newPosY);
  }, []);

  const handleAvatarDragEnd = useCallback(() => {
    if (avatarDragState.current) {
      avatarDragState.current.dragging = false;
    }
  }, []);

  // Attach non-passive touchmove to cover so e.preventDefault() actually works on mobile
  useEffect(() => {
    const el = coverRef.current;
    if (!el) return;
    const onTouchMove = (e: globalThis.TouchEvent) => {
      if (!dragState.current?.dragging) return;
      e.preventDefault();
      handleCoverDragMove(e.touches[0].clientY, el.clientHeight);
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [handleCoverDragMove]);

  // Attach non-passive touchmove to avatar so e.preventDefault() actually works on mobile
  useEffect(() => {
    const el = avatarRef.current;
    if (!el) return;
    const onTouchMove = (e: globalThis.TouchEvent) => {
      if (!avatarDragState.current?.dragging) return;
      e.preventDefault();
      handleAvatarDragMove(e.touches[0].clientX, e.touches[0].clientY, el.clientWidth, el.clientHeight);
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [handleAvatarDragMove]);

  const handleUpload = async (file: File, type: "avatar" | "cover") => {
    setUploading(type);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/media/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      if (type === "avatar") setAvatarUrl(res.data.url);
      else setCoverUrl(res.data.url);
      setUploadSuccess(type);
      setTimeout(() => setUploadSuccess(null), 2000);
    } catch {
      setError(`Gagal upload foto ${type === "cover" ? "cover" : "profil"}. Coba lagi.`);
      setTimeout(() => setError(""), 4000);
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) { setError("Nama tidak boleh kosong"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await api.patch("/auth/profile", {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim() || null,
        website: website.trim() || null,
        avatarUrl: avatarUrl || null,
        avatarPositionX,
        avatarPositionY,
        coverUrl: coverUrl || null,
        coverPositionY,
      });
      updateUser({
        displayName: res.data.displayName,
        bio: res.data.bio,
        avatarUrl: res.data.avatarUrl,
      });
      setSaved(true);
      setTimeout(() => router.push("/profile"), 800);
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-10">

      {/* Upload toast */}
      {(error || uploadSuccess) && (
        <div className={cn(
          "fixed top-4 left-4 right-4 z-50 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg flex items-center gap-2 transition-all",
          error ? "bg-[#d42b2b]" : "bg-green-500"
        )}>
          {error ? "❌ " + error : "✅ Foto berhasil diupload!"}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="font-bold text-base text-gray-900">Edit Profil</span>
        <button
          onClick={handleSave}
          disabled={saving || saved || uploading !== null}
          className={cn(
            "font-bold text-sm px-3 py-1.5 rounded-full transition-all active:scale-95",
            saved
              ? "bg-green-100 text-green-600"
              : saving
              ? "text-[#d42b2b] opacity-60"
              : "text-[#d42b2b] hover:bg-red-50 active:bg-red-100 disabled:opacity-50"
          )}
        >
          {saved ? (
            <span className="flex items-center gap-1"><Check size={13} />Tersimpan</span>
          ) : saving ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-[#d42b2b] border-t-transparent rounded-full animate-spin inline-block" />
              Simpan
            </span>
          ) : "Simpan"}
        </button>
      </header>

      {/* Cover + Avatar */}
      <div className="relative">
        {/* Cover area */}
        <div
          ref={coverRef}
          className="h-40 relative overflow-hidden"
          onMouseDown={coverUrl ? (e) => { e.preventDefault(); handleCoverDragStart(e.clientY); } : undefined}
          onMouseMove={coverUrl ? (e) => { if (dragState.current?.dragging) handleCoverDragMove(e.clientY, e.currentTarget.clientHeight); } : undefined}
          onMouseUp={coverUrl ? () => handleCoverDragEnd() : undefined}
          onMouseLeave={coverUrl ? () => handleCoverDragEnd() : undefined}
          onTouchStart={coverUrl ? (e) => { if ((e.target as HTMLElement).closest("[data-upload]")) return; handleCoverDragStart(e.touches[0].clientY); } : undefined}
          onTouchEnd={coverUrl ? () => handleCoverDragEnd() : undefined}
          style={coverUrl ? { cursor: "grab" } : undefined}
        >
          {coverUrl ? (
            <>
              <img
                src={coverUrl}
                alt="cover"
                className="w-full h-full object-cover select-none pointer-events-none"
                style={{ objectPosition: `center ${coverPositionY}%` }}
                draggable={false}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-black/40 text-white text-xs font-semibold px-3 py-1 rounded-full select-none">
                  ↕ Geser untuk atur posisi
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#c0281f] via-[#8b0000] to-[#3d0000]">
              <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(circle at 30% 50%, rgba(255,255,255,0.07) 0%, transparent 60%)"}} />
            </div>
          )}
          <label
            htmlFor="cover-upload"
            data-upload="cover"
            className={cn(
              "absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer select-none z-10",
              uploading === "cover" && "opacity-70 pointer-events-none"
            )}
          >
            {uploading === "cover"
              ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              : <Camera size={12} />
            }
            Ubah Cover
          </label>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "cover")}
          />
        </div>

        {/* Avatar overlapping */}
        <div className="absolute left-4 -bottom-10">
          <div className="relative">
            <div
              ref={avatarRef}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-[#c0281f] to-[#e8453a]"
              onMouseDown={avatarUrl ? (e) => { e.preventDefault(); handleAvatarDragStart(e.clientX, e.clientY); } : undefined}
              onMouseMove={avatarUrl ? (e) => { if (avatarDragState.current?.dragging) handleAvatarDragMove(e.clientX, e.clientY, e.currentTarget.clientWidth, e.currentTarget.clientHeight); } : undefined}
              onMouseUp={avatarUrl ? () => handleAvatarDragEnd() : undefined}
              onMouseLeave={avatarUrl ? () => handleAvatarDragEnd() : undefined}
              onTouchStart={avatarUrl ? (e) => handleAvatarDragStart(e.touches[0].clientX, e.touches[0].clientY) : undefined}
              onTouchEnd={avatarUrl ? () => handleAvatarDragEnd() : undefined}
              style={avatarUrl ? { cursor: "grab" } : undefined}
            >
              {avatarUrl
                ? (
                  <>
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover select-none pointer-events-none" style={{ objectPosition: `${avatarPositionX}% ${avatarPositionY}%` }} draggable={false} />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="bg-black/40 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full select-none leading-tight">↕↔ Geser</span>
                    </div>
                  </>
                )
                : <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">{(displayName || user.displayName)[0]}</div>
              }
            </div>
            <label
              htmlFor="avatar-upload"
              className={cn(
                "absolute bottom-0 right-0 w-7 h-7 bg-gray-900 border-2 border-white rounded-full flex items-center justify-center cursor-pointer",
                uploading === "avatar" && "opacity-70 pointer-events-none"
              )}
            >
              {uploading === "avatar"
                ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <Camera size={11} className="text-white" />
              }
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "avatar")}
            />
          </div>
        </div>
      </div>

      {/* Foto Profil label */}
      <div className="mt-14 mx-4 bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">Foto Profil</p>
          <p className="text-xs text-gray-400 mt-0.5">Foto profil akan terlihat oleh semua orang</p>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#c0281f] to-[#e8453a] flex items-center justify-center">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-sm">{(displayName || user.displayName)[0]}</span>
          }
        </div>
      </div>

      {/* Info fields */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Nama */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-50">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nama Lengkap</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            placeholder="Nama kamu"
            className="w-full mt-1.5 text-sm font-medium text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-300"
          />
        </div>

        {/* Username */}
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Username</label>
            <p className="mt-1.5 text-sm font-medium text-gray-300">@{user.username}</p>
            <p className="text-xs text-gray-300 mt-0.5">Username tidak bisa diubah</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>

        {/* Bio */}
        <div className="px-4 pt-3 pb-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
            rows={3}
            placeholder="Ceritakan sedikit tentang kamu..."
            className="w-full mt-1.5 text-sm text-gray-700 bg-transparent border-none outline-none resize-none placeholder:text-gray-300"
          />
          <p className={cn("text-xs text-right", bio.length >= 140 ? "text-[#d42b2b]" : "text-gray-300")}>{bio.length}/150</p>
        </div>
      </div>

      {/* Lokasi + Website */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center gap-3">
          <MapPin size={16} className="text-gray-300 flex-shrink-0" />
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lokasi</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
              placeholder="Kota, Negara"
              className="w-full mt-1 text-sm font-medium text-gray-800 bg-transparent border-none outline-none placeholder:text-gray-300"
            />
          </div>
        </div>
        <div className="px-4 py-3 flex items-center gap-3">
          <Link2 size={16} className="text-gray-300 flex-shrink-0" />
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Website / Link</label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              maxLength={200}
              placeholder="linktr.ee/username"
              className="w-full mt-1 text-sm font-medium text-gray-800 bg-transparent border-none outline-none placeholder:text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Preferensi */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-bold text-[#c0281f] uppercase tracking-wide">Preferensi</p>
        </div>
        <ToggleRow
          label="Tampilkan status online"
          sub="Orang lain dapat melihat saat kamu online"
          value={showOnline}
          onChange={setShowOnline}
        />
        <ToggleRow
          label="Izinkan pesan dari semua orang"
          sub="Semua orang bisa mengirimiku pesan"
          value={allowMessages}
          onChange={setAllowMessages}
          last
        />
      </div>

      {/* Tautan Sosial */}
      <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-bold text-[#c0281f] uppercase tracking-wide">Tautan Sosial</p>
        </div>
        {socialLinks.map((s, i) => (
          <div key={s.platform} className={cn("flex items-center gap-3 px-4 py-3", i < socialLinks.length - 1 && "border-b border-gray-50")}>
            <span className="text-lg w-8 text-center">{s.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">{s.platform}</p>
              <input
                value={s.value}
                onChange={(e) => setSocialLinks(links => links.map((l, j) => j === i ? { ...l, value: e.target.value } : l))}
                placeholder={s.placeholder}
                className="text-xs text-[#d42b2b] font-medium bg-transparent border-none outline-none placeholder:text-gray-300 w-full mt-0.5"
              />
            </div>
            <ChevronRight size={14} className="text-gray-200" />
          </div>
        ))}
        <button className="flex items-center gap-2 px-4 py-3 text-[#d42b2b] text-sm font-semibold">
          <Plus size={15} /> Tambah tautan sosial
        </button>
      </div>

      {error && <p className="mx-4 mt-3 text-sm text-[#d42b2b] text-center">{error}</p>}

      {/* Save button */}
      <div className="mx-4 mt-4">
        <button
          onClick={handleSave}
          disabled={saving || saved || uploading !== null}
          className={cn(
            "w-full py-4 font-bold text-base rounded-2xl disabled:opacity-60 active:scale-[0.98] transition-all shadow-lg",
            saved
              ? "bg-green-500 text-white shadow-green-200"
              : "bg-[#d42b2b] text-white hover:bg-[#c0281f] shadow-red-200"
          )}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-2"><Check size={18} />Profil Tersimpan!</span>
          ) : saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan...
            </span>
          ) : "Simpan Perubahan"}
        </button>
      </div>

    </div>
  );
}

function ToggleRow({ label, sub, value, onChange, last }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3", !last && "border-b border-gray-50")}>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "w-12 h-6 rounded-full transition-colors relative flex-shrink-0",
          value ? "bg-[#d42b2b]" : "bg-gray-200"
        )}
      >
        <div className={cn(
          "w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform",
          value ? "translate-x-6" : "translate-x-0.5"
        )} />
      </button>
    </div>
  );
}
