"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type FormData = z.infer<typeof schema>;

function isNetworkError(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const e = err as any;
  if (!e.response) return true;
  if (e.response?.status >= 500) return true;
  return false;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const doLogin = async (data: FormData, isRetry = false) => {
    try {
      setError("");
      const res = await api.post("/auth/login", data);
      setAuth(res.data.user, res.data.token);
      router.push("/");
    } catch (err: unknown) {
      if (isNetworkError(err)) {
        if (!isRetry) {
          setError("Server sedang memulai... mencoba lagi otomatis.");
          setRetrying(true);
          setTimeout(async () => {
            setRetrying(false);
            await doLogin(data, true);
          }, 3000);
        } else {
          setError("Server tidak dapat dijangkau. Coba beberapa saat lagi.");
        }
      } else {
        const msg = (err as any)?.response?.data?.message;
        setError(msg ?? "Email atau password salah.");
      }
    }
  };

  const onSubmit = (data: FormData) => doLogin(data);
  const isLoading = isSubmitting || retrying;

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto">

      {/* ── Hero Section ── */}
      <div className="relative flex items-start justify-between mb-8">
        {/* Left: logo + headline */}
        <div className="flex-1 pt-2 z-10">
          <div
            className="mb-5"
            style={{
              width: "100%",
              height: 90,
              backgroundImage: "url(/gueposting-logo-wide.png)",
              backgroundSize: "auto 90px",
              backgroundPosition: "-18px center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            Selamat datang<br />
            di{" "}
            <span className="text-[#d42b2b]" style={{ fontFamily: "var(--font-brand)" }}>GUEPOSTING</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-[200px]">
            Masuk untuk melanjutkan perjalanan berbagi dan menemukan hal terbaik seputar gadget.
          </p>
        </div>

        {/* Right: gadget illustration */}
        <div className="relative w-44 h-44 flex-shrink-0 -mr-2">
          {/* Pink gradient circle */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle at 60% 40%, #ffd6d6 0%, #ffecec 60%, transparent 100%)" }}
          />
          {/* Gadget emojis */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl drop-shadow-sm" style={{ marginLeft: 16, marginTop: 8 }}>📱</span>
            <span className="absolute bottom-5 right-3 text-4xl drop-shadow-sm">🎧</span>
            <span className="absolute top-4 right-5 text-3xl drop-shadow-sm">⌚</span>
          </div>
          {/* Floating badges */}
          <div className="absolute top-2 left-6 bg-white rounded-full w-9 h-9 shadow-md flex items-center justify-center text-lg">
            ❤️
          </div>
          <div className="absolute bottom-6 left-2 bg-white rounded-full w-8 h-8 shadow-md flex items-center justify-center text-base">
            🔥
          </div>
          <div className="absolute bottom-2 right-10 bg-white rounded-full w-8 h-8 shadow-md flex items-center justify-center text-base">
            👍
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex-1">

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Email</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Mail size={16} className="text-[#d42b2b]" />
            </div>
            <input
              type="email"
              placeholder="kamu@email.com"
              autoComplete="email"
              {...register("email")}
              className={cn(
                "w-full pl-14 pr-4 py-3.5 rounded-2xl border text-sm outline-none transition-colors",
                "bg-white placeholder:text-gray-400 text-gray-900",
                errors.email
                  ? "border-red-300 focus:border-[#d42b2b]"
                  : "border-gray-200 focus:border-[#d42b2b]"
              )}
            />
          </div>
          {errors.email && <p className="text-xs text-[#d42b2b] pl-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-[#d42b2b] hover:opacity-80">
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Lock size={16} className="text-[#d42b2b]" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              className={cn(
                "w-full pl-14 pr-12 py-3.5 rounded-2xl border text-sm outline-none transition-colors",
                "bg-white placeholder:text-gray-400 text-gray-900",
                errors.password
                  ? "border-red-300 focus:border-[#d42b2b]"
                  : "border-gray-200 focus:border-[#d42b2b]"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-[#d42b2b] pl-1">{errors.password.message}</p>}
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div className="relative">
            <input type="checkbox" defaultChecked className="sr-only peer" />
            <div className="w-5 h-5 rounded-md border-2 border-gray-200 peer-checked:bg-[#d42b2b] peer-checked:border-[#d42b2b] flex items-center justify-center transition-colors">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-white">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <span className="text-sm text-gray-600">Ingat saya</span>
        </label>

        {/* Error */}
        {error && (
          <div className={cn(
            "text-sm rounded-2xl px-4 py-3 flex items-center gap-2",
            error.includes("memulai") || error.includes("dijangkau")
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-red-50 text-[#d42b2b] border border-red-100"
          )}>
            {retrying && (
              <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-[0.98]",
            isLoading
              ? "bg-[#d42b2b]/60 cursor-not-allowed"
              : "bg-[#d42b2b] hover:bg-[#c0281f] shadow-lg shadow-red-200"
          )}
        >
          {retrying ? "Menghubungkan..." : isSubmitting ? "Masuk..." : "Masuk"}
        </button>
      </form>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium">atau masuk dengan</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* ── Social Buttons ── */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => {
            const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
            window.location.href = `${apiBase}/auth/google`;
          }}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,19.001,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          <span className="text-sm font-semibold text-gray-700">Masuk dengan Google</span>
        </button>
      </div>

      {/* ── Trust Badge ── */}
      <div className="flex items-center gap-4 bg-red-50/60 border border-red-100 rounded-2xl px-4 py-3 mb-6">
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#d42b2b" opacity="0.15"/>
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" stroke="#d42b2b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="#d42b2b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">Aman &amp; Terpercaya</p>
          <p className="text-xs text-gray-500 mt-0.5">Data kamu aman bersama GUEPOSTING. Kami tidak akan membagikannya.</p>
        </div>
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#d42b2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* ── Register Link ── */}
      <p className="text-center text-sm text-gray-500">
        Belum punya akun?{" "}
        <Link href="/register" className="text-[#d42b2b] font-bold hover:opacity-80">
          Daftar Sekarang
        </Link>
      </p>
    </div>
  );
}
