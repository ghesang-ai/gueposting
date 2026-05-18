"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ChevronDown, Search, X, Sparkles, Lightbulb, Wand2, ImagePlus, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const POST_TYPES = [
  { value: "review",     label: "Review",  emoji: "⭐" },
  { value: "photo",      label: "Foto",    emoji: "📷" },
  { value: "video",      label: "Video",   emoji: "🎬" },
  { value: "discussion", label: "Diskusi", emoji: "💬" },
  { value: "other",      label: "Lainnya", emoji: "···" },
] as const;

const TOPICS = ["#Diskusi", "#Review", "#Event", "#Tips & Trik", "#Rekomendasi", "#Unboxing", "#Versus", "#Harga"];

const CATEGORY_EMOJI: Record<string, string> = {
  smartphone: "📱", laptop: "💻", tablet: "📟", wearable: "⌚", audio: "🎧", other: "🔌",
};

interface Gadget { id: string; name: string; brand: string; imageUrl: string | null; category: string; }

const GADGET_CATEGORIES = [
  { value: "smartphone", label: "📱 Smartphone" },
  { value: "laptop",     label: "💻 Laptop" },
  { value: "tablet",     label: "📟 Tablet" },
  { value: "wearable",   label: "⌚ Wearable" },
  { value: "audio",      label: "🎧 Audio" },
  { value: "other",      label: "🔌 Lainnya" },
];

function NewPostPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user, _hasHydrated } = useAuthStore();

  const [postType, setPostType] = useState<string>("discussion");
  const [content, setContent] = useState("");
  const [selectedGadget, setSelectedGadget] = useState<Gadget | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("#Diskusi");
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Location
  const [location, setLocation] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Tag Teman
  const [taggedUsers, setTaggedUsers] = useState<{ id: string; displayName: string; username: string }[]>([]);
  const [showTagSearch, setShowTagSearch] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [tagResults, setTagResults] = useState<{ id: string; displayName: string; username: string; avatarUrl: string | null }[]>([]);

  // Jadwalkan
  const [scheduledAt, setScheduledAt] = useState("");

  // Poll state — auto-aktif jika dari query ?poll=1
  const [showPoll, setShowPoll] = useState(() => false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(3);

  useEffect(() => {
    if (searchParams.get("poll") === "1") setShowPoll(true);
  }, [searchParams]);

  // Gadget section
  const [trendingGadgets, setTrendingGadgets] = useState<Gadget[]>([]);
  const [gadgetSearch, setGadgetSearch] = useState("");
  const [gadgetResults, setGadgetResults] = useState<Gadget[]>([]);
  const [showGadgetSearch, setShowGadgetSearch] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  // New gadget form
  const [showNewGadgetForm, setShowNewGadgetForm] = useState(false);
  const [newGadgetName, setNewGadgetName] = useState("");
  const [newGadgetBrand, setNewGadgetBrand] = useState("");
  const [newGadgetCategory, setNewGadgetCategory] = useState("smartphone");
  const [savingGadget, setSavingGadget] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.push("/login");
  }, [token, router, _hasHydrated]);

  useEffect(() => {
    api.get("/gadgets/trending").then((r) => setTrendingGadgets(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!gadgetSearch.trim()) { setGadgetResults([]); setSearchDone(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/gadgets?search=${encodeURIComponent(gadgetSearch)}&limit=6`);
        setGadgetResults(res.data.data ?? res.data);
      } catch { setGadgetResults([]); }
      finally { setSearchDone(true); }
    }, 300);
    return () => clearTimeout(t);
  }, [gadgetSearch]);

  const fetchLocation = () => {
    if (!navigator.geolocation) { alert("Browser tidak mendukung lokasi."); return; }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await res.json();
          const addr = data.address;
          const place = addr.city || addr.town || addr.village || addr.county || addr.state || "Lokasi tidak diketahui";
          setLocation(`${place}, ${addr.country ?? "Indonesia"}`);
        } catch {
          setLocation("Lokasi tidak tersedia");
        } finally {
          setLoadingLocation(false);
        }
      },
      () => { setLoadingLocation(false); alert("Izin lokasi ditolak."); }
    );
  };

  useEffect(() => {
    if (!tagSearch.trim()) { setTagResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/users?search=${encodeURIComponent(tagSearch)}&limit=5`);
        setTagResults(res.data.data ?? res.data);
      } catch { setTagResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [tagSearch]);

  const saveNewGadget = async () => {
    if (!newGadgetName.trim() || !newGadgetBrand.trim()) return;
    setSavingGadget(true);
    try {
      const res = await api.post("/gadgets", {
        name: newGadgetName.trim(),
        brand: newGadgetBrand.trim(),
        category: newGadgetCategory,
      });
      setSelectedGadget(res.data);
      setShowNewGadgetForm(false);
      setShowGadgetSearch(false);
      setGadgetSearch("");
      setNewGadgetName("");
      setNewGadgetBrand("");
      setNewGadgetCategory("smartphone");
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Gagal menambah gadget. Coba lagi.");
    } finally {
      setSavingGadget(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMediaUrls((p) => [...p, res.data.url]);
    } catch { alert("Upload gagal. Coba lagi."); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!content.trim()) { textareaRef.current?.focus(); return; }
    if (showPoll && !pollQuestion.trim()) { alert("Tulis pertanyaan polling terlebih dahulu."); return; }
    if (showPoll && pollOptions.filter((o) => o.trim()).length < 2) { alert("Minimal 2 pilihan polling."); return; }

    setSubmitting(true);
    try {
      await api.post("/posts", {
        content,
        type: postType,
        gadgetId: selectedGadget?.id,
        rating: postType === "review" ? ratingValue || undefined : undefined,
        mediaUrls,
        ...(location && { location }),
        ...(taggedUsers.length > 0 && { taggedUserIds: taggedUsers.map((u) => u.id) }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt).toISOString() }),
        ...(showPoll && {
          poll: {
            question: pollQuestion.trim(),
            options: pollOptions.filter((o) => o.trim()),
            durationDays: pollDuration,
          },
        }),
      });
      router.push("/feed");
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      alert(msg ?? "Gagal membuat post. Coba lagi.");
    } finally { setSubmitting(false); }
  };

  const placeholders: Record<string, string> = {
    review: "Tulis review jujur kamu tentang gadget ini...",
    photo: "Ceritakan foto yang kamu bagikan...",
    video: "Deskripsi video kamu...",
    discussion: "Mulai diskusi seru dengan komunitas GUEPOSTING...",
    other: "Apa yang ingin kamu bagikan?",
  };

  const displayedTopics = showAllTopics ? TOPICS : TOPICS.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Red header */}
      <header className="sticky top-0 z-20 bg-[#c0281f] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white/80 hover:text-white p-1">
          <ArrowLeft size={22} />
        </button>
        <span className="text-white font-bold text-base">Buat Post</span>
        <button
          onClick={submit}
          disabled={submitting || !content.trim()}
          className="bg-white text-[#c0281f] font-bold text-sm px-5 py-1.5 rounded-full disabled:opacity-50 transition-opacity flex items-center gap-1.5"
        >
          {submitting && <Loader2 size={13} className="animate-spin" />}
          Post
        </button>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* User info */}
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3">
          <Avatar className="w-11 h-11">
            <AvatarImage src={user?.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-[#d42b2b] text-white font-bold text-lg">
              {user?.displayName?.[0] ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm">{user?.displayName}</p>
              {(user as any)?.trustScore >= 70 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#d42b2b"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              )}
            </div>
            <button className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              🌐 Publik <ChevronDown size={11} />
            </button>
          </div>
          <button className="border border-[#d42b2b] text-[#d42b2b] text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors">
            Template
          </button>
        </div>

        {/* Post type */}
        <div className="bg-white rounded-2xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipe Postingan</p>
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {POST_TYPES.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setPostType(value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                  postType === value
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Gadget picker */}
        <div className="bg-white rounded-2xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Gadget (opsional)</p>

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={gadgetSearch}
              onChange={(e) => { setGadgetSearch(e.target.value); setShowGadgetSearch(true); setSearchDone(false); setShowNewGadgetForm(false); }}
              onFocus={() => setShowGadgetSearch(true)}
              placeholder="Cari atau pilih gadget..."
              className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 rounded-xl border border-gray-100 focus:border-gray-300 outline-none"
            />
            {showGadgetSearch && gadgetSearch.trim() && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg z-10 max-h-52 overflow-y-auto">
                {gadgetResults.map((g) => (
                  <button key={g.id} type="button"
                    onClick={() => { setSelectedGadget(g); setGadgetSearch(""); setGadgetResults([]); setShowGadgetSearch(false); setSearchDone(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {g.imageUrl ? <img src={g.imageUrl} alt={g.name} className="w-full h-full object-contain" /> : <span className="text-sm">{CATEGORY_EMOJI[g.category] ?? "📱"}</span>}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{g.name}</p>
                      <p className="text-[10px] text-gray-400">{g.brand}</p>
                    </div>
                  </button>
                ))}
                {searchDone && gadgetResults.length === 0 && (
                  <button type="button"
                    onClick={() => { setShowNewGadgetForm(true); setShowGadgetSearch(false); setNewGadgetName(gadgetSearch); }}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-red-50 text-left text-[#d42b2b]">
                    <span className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-lg flex-shrink-0">+</span>
                    <div>
                      <p className="text-xs font-semibold">Tambah "{gadgetSearch}" sebagai gadget baru</p>
                      <p className="text-[10px] text-gray-400">Belum ada di database GUEPOSTING</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* New gadget form — muncul saat user klik tambah */}
          {showNewGadgetForm && (
            <div className="border border-[#d42b2b]/20 bg-red-50/50 rounded-xl p-3 space-y-2.5">
              <p className="text-xs font-bold text-[#d42b2b] uppercase tracking-wide">+ Tambah Gadget Baru</p>
              <input
                type="text"
                value={newGadgetName}
                onChange={(e) => setNewGadgetName(e.target.value)}
                placeholder="Nama gadget (contoh: Galaxy S25 FE)"
                className="w-full text-sm px-3 py-2 bg-white rounded-xl border border-gray-100 focus:border-[#d42b2b] outline-none"
              />
              <input
                type="text"
                value={newGadgetBrand}
                onChange={(e) => setNewGadgetBrand(e.target.value)}
                placeholder="Brand (contoh: Samsung)"
                className="w-full text-sm px-3 py-2 bg-white rounded-xl border border-gray-100 focus:border-[#d42b2b] outline-none"
              />
              <div className="grid grid-cols-3 gap-1.5">
                {GADGET_CATEGORIES.map((cat) => (
                  <button key={cat.value} type="button"
                    onClick={() => setNewGadgetCategory(cat.value)}
                    className={cn("text-xs py-2 rounded-xl font-medium transition-colors",
                      newGadgetCategory === cat.value ? "bg-[#d42b2b] text-white" : "bg-white text-gray-600 border border-gray-100")}>
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowNewGadgetForm(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded-xl">
                  Batal
                </button>
                <button type="button" onClick={saveNewGadget}
                  disabled={savingGadget || !newGadgetName.trim() || !newGadgetBrand.trim()}
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#d42b2b] rounded-xl disabled:opacity-50 flex items-center justify-center gap-1">
                  {savingGadget && <Loader2 size={11} className="animate-spin" />}
                  Simpan & Pilih
                </button>
              </div>
            </div>
          )}

          {/* Gadget cards horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Tambah button */}
            <button
              onClick={() => textareaRef.current?.focus()}
              className="flex-shrink-0 w-20 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-200 rounded-xl h-24 text-gray-400 hover:border-gray-400 transition-colors"
            >
              <span className="text-xl">+</span>
              <span className="text-[10px]">Tambah</span>
            </button>

            {trendingGadgets.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGadget(selectedGadget?.id === g.id ? null : g)}
                className={cn(
                  "flex-shrink-0 w-20 flex flex-col items-center justify-center gap-1 border-2 rounded-xl h-24 p-2 transition-all",
                  selectedGadget?.id === g.id
                    ? "border-[#d42b2b] bg-red-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-300"
                )}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  {g.imageUrl
                    ? <img src={g.imageUrl} alt={g.name} className="w-full h-full object-contain" />
                    : <span className="text-2xl">{CATEGORY_EMOJI[g.category] ?? "📱"}</span>}
                </div>
                <p className="text-[9px] text-center font-medium text-gray-700 leading-tight line-clamp-2">{g.name}</p>
                {selectedGadget?.id === g.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedGadget(null); }}
                    className="absolute top-1 right-1 bg-[#d42b2b] rounded-full p-0.5"
                  >
                    <X size={8} className="text-white" />
                  </button>
                )}
              </button>
            ))}
          </div>

          {selectedGadget && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-[#d42b2b]">✓ {selectedGadget.brand} {selectedGadget.name}</span>
              <button onClick={() => setSelectedGadget(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={13} /></button>
            </div>
          )}
        </div>

        {/* Topic hashtags */}
        <div className="bg-white rounded-2xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Topik (opsional)</p>
          <div className="flex flex-wrap gap-2">
            {displayedTopics.map((t) => (
              <button key={t} onClick={() => setSelectedTopic(selectedTopic === t ? "" : t)}
                className={cn("text-xs font-semibold px-3 py-1.5 rounded-full transition-all",
                  selectedTopic === t ? "bg-[#d42b2b] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                {t}
              </button>
            ))}
            <button onClick={() => setShowAllTopics((p) => !p)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1">
              <ChevronDown size={12} className={cn("transition-transform", showAllTopics && "rotate-180")} />
            </button>
          </div>
        </div>

        {/* Rating (review only) */}
        {postType === "review" && (
          <div className="bg-white rounded-2xl px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating (1–10)</p>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <button key={i} onClick={() => setRatingValue(i + 1)}
                  className={cn("w-7 h-7 rounded-lg text-xs font-bold transition-colors",
                    ratingValue >= i + 1 ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-500")}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content + AI */}
        <div className="bg-white rounded-2xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Konten</p>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder={placeholders[postType] ?? "Apa yang ingin kamu bagikan?"}
            className="w-full text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none leading-relaxed"
          />
          <p className="text-right text-[10px] text-gray-400">{content.length}/2000</p>
          <div className="flex gap-2 border-t border-gray-50 pt-2 overflow-x-auto no-scrollbar">
            {[
              { icon: <Sparkles size={12} />, label: "AI Bantu Tulis" },
              { icon: <Lightbulb size={12} />, label: "Buat lebih menarik" },
              { icon: <Wand2 size={12} />, label: "Rapikan tulisan" },
            ].map(({ icon, label }) => (
              <button key={label}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#d42b2b] whitespace-nowrap px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Media */}
        <div className="bg-white rounded-2xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Media (opsional)</p>
          <div className="flex gap-2 flex-wrap">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                <Image src={url} alt="" fill className="object-cover" />
                <button onClick={() => setMediaUrls((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5">
                  <X size={11} className="text-white" />
                </button>
              </div>
            ))}
            {mediaUrls.length < 4 && (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-[#d42b2b] hover:text-[#d42b2b] transition-colors">
                {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
                <span className="text-[10px] font-medium">{uploading ? "Upload..." : "Tambah Media"}</span>
              </button>
            )}
          </div>
          {mediaUrls.length === 0 && (
            <p className="text-[10px] text-gray-400">💡 Tambahkan foto/video untuk mendapatkan lebih banyak interaksi</p>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ""; }} />
        </div>

        {/* Extra options */}
        <div className="bg-white rounded-2xl px-4 py-3 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Opsi Lainnya</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-5">
              <button onClick={() => setShowPoll((p) => !p)}
                className={cn("flex flex-col items-center gap-1 transition-colors", showPoll ? "text-[#d42b2b]" : "text-gray-400 hover:text-gray-600")}>
                <span className="text-xl">📊</span>
                <span className="text-[9px] font-medium">Polling</span>
              </button>
              {/* Lokasi */}
              <button
                onClick={location ? () => setLocation("") : fetchLocation}
                disabled={loadingLocation}
                className={cn("flex flex-col items-center gap-1 transition-colors", location ? "text-[#d42b2b]" : "text-gray-400 hover:text-gray-600")}
              >
                {loadingLocation ? <Loader2 size={20} className="animate-spin" /> : <span className="text-xl">📍</span>}
                <span className="text-[9px] font-medium">Lokasi</span>
              </button>

              {/* Tag Teman */}
              <button
                onClick={() => setShowTagSearch((p) => !p)}
                className={cn("flex flex-col items-center gap-1 transition-colors", taggedUsers.length > 0 ? "text-[#d42b2b]" : "text-gray-400 hover:text-gray-600")}
              >
                <span className="text-xl">👥</span>
                <span className="text-[9px] font-medium">Tag Teman</span>
              </button>

              {/* Jadwalkan */}
              <button
                onClick={() => { const el = document.getElementById("schedule-input"); el?.showPicker?.(); el?.focus(); }}
                className={cn("flex flex-col items-center gap-1 transition-colors relative", scheduledAt ? "text-[#d42b2b]" : "text-gray-400 hover:text-gray-600")}
              >
                <span className="text-xl">🕐</span>
                <span className="text-[9px] font-medium">Jadwalkan</span>
                <input
                  id="schedule-input"
                  type="datetime-local"
                  value={scheduledAt}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </button>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-semibold text-gray-700">Izinkan komentar</span>
              <button onClick={() => setAllowComments((p) => !p)}
                className={cn("w-11 h-6 rounded-full transition-all relative", allowComments ? "bg-[#d42b2b]" : "bg-gray-200")}>
                <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all", allowComments ? "left-5" : "left-0.5")} />
              </button>
            </div>
          </div>

          {/* Status chips: lokasi, tagged users, scheduled */}
          {(location || taggedUsers.length > 0 || scheduledAt) && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
              {location && (
                <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-full px-3 py-1">
                  <span className="text-xs">📍</span>
                  <span className="text-xs font-medium text-[#d42b2b] max-w-[140px] truncate">{location}</span>
                  <button onClick={() => setLocation("")} className="text-gray-400 hover:text-gray-600 ml-0.5"><X size={11} /></button>
                </div>
              )}
              {taggedUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                  <span className="text-xs">👤</span>
                  <span className="text-xs font-medium text-blue-600">@{u.username}</span>
                  <button onClick={() => setTaggedUsers((p) => p.filter((x) => x.id !== u.id))} className="text-gray-400 hover:text-gray-600 ml-0.5"><X size={11} /></button>
                </div>
              ))}
              {scheduledAt && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
                  <span className="text-xs">🕐</span>
                  <span className="text-xs font-medium text-amber-600">
                    {new Date(scheduledAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <button onClick={() => setScheduledAt("")} className="text-gray-400 hover:text-gray-600 ml-0.5"><X size={11} /></button>
                </div>
              )}
            </div>
          )}

          {/* Tag Teman search */}
          {showTagSearch && (
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tag Teman</p>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Cari nama atau username..."
                  className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 rounded-xl border border-gray-100 focus:border-gray-300 outline-none"
                />
              </div>
              {tagResults.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  {tagResults.filter((u) => !taggedUsers.find((t) => t.id === u.id)).map((u) => (
                    <button key={u.id} type="button"
                      onClick={() => { setTaggedUsers((p) => [...p, u]); setTagSearch(""); setTagResults([]); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0">
                      <div className="w-7 h-7 rounded-full bg-[#d42b2b] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.displayName[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{u.displayName}</p>
                        <p className="text-[10px] text-gray-400">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Poll builder — expands inline */}
          {showPoll && (
            <div className="border-t border-gray-100 pt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pertanyaan Poll</p>
                <textarea
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  rows={2}
                  maxLength={150}
                  placeholder="Tulis pertanyaan polling kamu..."
                  className="w-full text-sm px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#d42b2b] outline-none resize-none"
                />
                <p className="text-right text-[10px] text-gray-400 mt-0.5">{pollQuestion.length}/150</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pilihan (min. 2, maks. 5)</p>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#d42b2b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => setPollOptions((p) => p.map((v, j) => j === i ? e.target.value : v))}
                      placeholder={i < 2 ? `Pilihan ${i + 1}` : `Pilihan ${i + 1} (opsional)`}
                      maxLength={80}
                      className="flex-1 text-sm px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 focus:border-gray-300 outline-none"
                    />
                    {i >= 2 && (
                      <button onClick={() => setPollOptions((p) => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <button onClick={() => setPollOptions((p) => [...p, ""])}
                    className="w-full text-xs text-[#d42b2b] font-semibold py-2 border border-dashed border-[#d42b2b]/40 rounded-xl hover:bg-red-50 transition-colors">
                    + Tambah Pilihan
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Durasi</p>
                <div className="flex gap-2">
                  {[1, 3, 7, 14].map((d) => (
                    <button key={d} onClick={() => setPollDuration(d)}
                      className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-colors",
                        pollDuration === d ? "bg-[#d42b2b] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                      {d} Hari
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}

export default function NewPostPage() {
  return (
    <Suspense>
      <NewPostPageInner />
    </Suspense>
  );
}
