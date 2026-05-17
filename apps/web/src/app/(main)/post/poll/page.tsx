"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function NewPollPage() {
  const router = useRouter();
  const { token, user, _hasHydrated } = useAuthStore();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState(3);
  const [gadgetSearch, setGadgetSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) router.push("/login");
  }, [token, router, _hasHydrated]);

  const addOption = () => {
    if (options.length < 5) setOptions((p) => [...p, ""]);
  };

  const removeOption = (i: number) => {
    setOptions((p) => p.filter((_, j) => j !== i));
  };

  const updateOption = (i: number, val: string) => {
    setOptions((p) => p.map((v, j) => (j === i ? val : v)));
  };

  const canSubmit = question.trim() && options.filter((o) => o.trim()).length >= 2;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/posts", {
        content: question.trim(),
        type: "discussion",
        poll: {
          question: question.trim(),
          options: options.filter((o) => o.trim()),
          durationDays: duration,
        },
      });
      router.push("/feed");
    } catch {
      alert("Gagal membuat polling. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#c0281f] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white/80 hover:text-white p-1">
          <ArrowLeft size={22} />
        </button>
        <span className="text-white font-bold text-base">Buat Polling</span>
        <button
          onClick={submit}
          disabled={submitting || !canSubmit}
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
          <div>
            <p className="font-bold text-sm">{user?.displayName}</p>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
              🌐 Publik
            </div>
          </div>
        </div>

        {/* Pertanyaan */}
        <div className="bg-white rounded-2xl px-4 py-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pertanyaan Poll</p>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={150}
            autoFocus
            placeholder="Tulis pertanyaan polling kamu, contoh: &quot;Mana yang lebih worth it dibeli sekarang?&quot;"
            className="w-full text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none leading-relaxed"
          />
          <p className="text-right text-[10px] text-gray-400">{question.length}/150</p>
        </div>

        {/* Pilihan */}
        <div className="bg-white rounded-2xl px-4 py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pilihan (min. 2, maks. 5)</p>
          <div className="space-y-2.5">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[#d42b2b] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={i < 2 ? `Pilihan ${i + 1}` : `Pilihan ${i + 1} (opsional)`}
                  maxLength={80}
                  className="flex-1 text-sm px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 focus:border-[#d42b2b] outline-none transition-colors"
                />
                {i >= 2 && (
                  <button onClick={() => removeOption(i)} className="text-gray-300 hover:text-gray-500 transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 5 && (
            <button
              onClick={addOption}
              className="w-full text-sm text-[#d42b2b] font-semibold py-2.5 border-2 border-dashed border-[#d42b2b]/30 rounded-xl hover:bg-red-50 transition-colors"
            >
              + Tambah Pilihan
            </button>
          )}
        </div>

        {/* Durasi */}
        <div className="bg-white rounded-2xl px-4 py-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Durasi Polling</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { days: 1,  label: "1 Hari" },
              { days: 3,  label: "3 Hari" },
              { days: 7,  label: "7 Hari" },
              { days: 14, label: "14 Hari" },
            ].map(({ days, label }) => (
              <button
                key={days}
                onClick={() => setDuration(days)}
                className={cn(
                  "py-3 rounded-xl text-sm font-bold transition-colors",
                  duration === days
                    ? "bg-[#d42b2b] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center">
            Polling akan otomatis berakhir setelah <span className="font-semibold text-gray-600">{duration} hari</span>
          </p>
        </div>

        {/* Preview */}
        {question.trim() && options.filter((o) => o.trim()).length >= 2 && (
          <div className="bg-white rounded-2xl px-4 py-4 space-y-2 border-2 border-[#d42b2b]/20">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</p>
            <div className="border border-gray-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>📊</span>
                <span>POLLING · {duration} hari tersisa</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">{question}</p>
              <div className="space-y-1.5">
                {options.filter((o) => o.trim()).map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
