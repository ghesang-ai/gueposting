"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    displayName: z.string().min(2, "Nama minimal 2 karakter").max(60),
    username: z
      .string()
      .min(3, "Username minimal 3 karakter")
      .max(30)
      .regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, dan underscore"),
    email: z.string().email("Email tidak valid"),
    phone: z
      .string()
      .min(9, "No. telepon tidak valid")
      .max(15)
      .regex(/^[0-9+\-\s]+$/, "Format no. telepon tidak valid")
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const features = [
  {
    icon: "👥",
    title: "Komunitas Aktif",
    desc: "Bergabung dengan ribuan pecinta gadget",
  },
  {
    icon: "💬",
    title: "Review & Diskusi",
    desc: "Bagikan pengalaman dan dapatkan insight terbaik",
  },
  {
    icon: "✅",
    title: "Informasi Terpercaya",
    desc: "Update terbaru seputar gadget, promo dan event menarik",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const passwordValue = watch("password") ?? "";

  const passwordChecks = [
    { label: "Minimal 8 karakter", met: passwordValue.length >= 8 },
    {
      label: "Mengandung huruf besar dan kecil",
      met: /[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue),
    },
    {
      label: "Mengandung angka atau simbol",
      met: /[0-9!@#$%^&*]/.test(passwordValue),
    },
  ];

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      const res = await api.post("/auth/register", {
        displayName: data.displayName,
        username: data.username,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
      });
      setAuth(res.data.user, res.data.token);
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(msg ?? "Pendaftaran gagal. Cek kembali data kamu.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left Panel (red branding) ── */}
      <div
        className="md:w-2/5 flex flex-col md:min-h-screen"
        style={{ backgroundColor: "#c0281f" }}
      >
        {/* Mobile: compact header */}
        <div className="md:hidden flex items-center gap-3 px-6 py-5">
          <Image src="/gueposting-icon-light.png" alt="GUEPOSTING" width={36} height={36} className="object-contain" />
          <span className="font-black text-white text-xl tracking-tight" style={{ fontFamily: "var(--font-brand)" }}>GUEPOSTING</span>
        </div>

        {/* Desktop: full branding panel */}
        <div className="hidden md:flex flex-col flex-1 px-10 py-12 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image src="/gueposting-icon-light.png" alt="GUEPOSTING" width={44} height={44} className="object-contain" />
            <span className="font-black text-white text-2xl tracking-tight" style={{ fontFamily: "var(--font-brand)" }}>GUEPOSTING</span>
          </div>

          {/* Hero */}
          <div className="flex flex-col items-start gap-3">
            <h1 className="text-3xl font-bold text-white leading-snug">
              Bergabung ke GUEPOSTING
            </h1>
            <p className="text-white/80 text-sm">
              Komunitas gadget terpercaya di Indonesia
            </p>

            {/* Gadget illustration */}
            <div className="relative my-6 flex items-center justify-center w-full">
              <div className="w-48 h-48 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center relative">
                <span className="text-7xl">📱</span>
                <span className="absolute -top-3 -right-3 text-4xl">💻</span>
                <span className="absolute -bottom-3 -left-3 text-4xl">🎧</span>
                <span className="absolute top-2 -left-6 text-3xl">⌚</span>
                {/* floating heart badge */}
                <div className="absolute -top-4 right-6 bg-white rounded-full p-2 shadow-lg">
                  <span className="text-[#d42b2b] text-xl">❤️</span>
                </div>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-col gap-4 w-full">
              {features.map((f) => (
                <div key={f.title} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-lg">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none">
                      {f.title}
                    </p>
                    <p className="text-white/70 text-xs mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* bottom spacer */}
          <div />
        </div>
      </div>

      {/* ── Right Panel (white form) ── */}
      <div className="md:w-3/5 flex flex-col bg-white">
        {/* Top-right login link */}
        <div className="flex justify-end px-6 pt-6 pb-2">
          <p className="text-sm text-gray-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-gray-900 hover:underline"
            >
              Masuk
            </Link>
          </p>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-start md:items-center justify-center px-6 md:px-16 pb-10">
          <div className="w-full max-w-md">
            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Daftar Akun Baru
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Isi data dirimu untuk memulai
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label
                  htmlFor="displayName"
                  className="text-sm font-medium text-gray-700"
                >
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="displayName"
                    placeholder="Nama kamu"
                    autoComplete="name"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-colors",
                      "focus:ring-2 focus:ring-[#d42b2b]/30 focus:border-[#d42b2b]",
                      errors.displayName
                        ? "border-red-400"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    {...register("displayName")}
                  />
                </div>
                {errors.displayName && (
                  <p className="text-red-500 text-xs">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
                    @
                  </span>
                  <input
                    id="username"
                    placeholder="username_kamu"
                    autoComplete="username"
                    className={cn(
                      "w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-colors",
                      "focus:ring-2 focus:ring-[#d42b2b]/30 focus:border-[#d42b2b]",
                      errors.username
                        ? "border-red-400"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-xs">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="kamu@email.com"
                    autoComplete="email"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-colors",
                      "focus:ring-2 focus:ring-[#d42b2b]/30 focus:border-[#d42b2b]",
                      errors.email
                        ? "border-red-400"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email.message}</p>
                )}
              </div>

              {/* No. Telepon */}
              <div className="space-y-1">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  No. Telepon{" "}
                  <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    autoComplete="tel"
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-colors",
                      "focus:ring-2 focus:ring-[#d42b2b]/30 focus:border-[#d42b2b]",
                      errors.phone
                        ? "border-red-400"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    {...register("phone")}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-xs">{errors.phone.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    autoComplete="new-password"
                    className={cn(
                      "w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-colors",
                      "focus:ring-2 focus:ring-[#d42b2b]/30 focus:border-[#d42b2b]",
                      errors.password
                        ? "border-red-400"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    {...register("password", {
                      onBlur: () => setPasswordTouched(true),
                    })}
                    onChange={(e) => {
                      if (e.target.value.length > 0) setPasswordTouched(true);
                      // propagate to react-hook-form
                      register("password").onChange(e);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs">
                    {errors.password.message}
                  </p>
                )}

                {/* Password requirements */}
                {passwordTouched && (
                  <div className="mt-2 space-y-1">
                    {passwordChecks.map((check) => (
                      <div
                        key={check.label}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                            check.met ? "bg-green-500" : "bg-gray-200"
                          )}
                        >
                          {check.met && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              viewBox="0 0 12 12"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-xs",
                            check.met ? "text-green-600" : "text-gray-400"
                          )}
                        >
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-1">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                    className={cn(
                      "w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-colors",
                      "focus:ring-2 focus:ring-[#d42b2b]/30 focus:border-[#d42b2b]",
                      errors.confirmPassword
                        ? "border-red-400"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Global error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-70"
                style={{ backgroundColor: "#d42b2b" }}
              >
                {isSubmitting ? "Mendaftar..." : "Daftar Sekarang"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 whitespace-nowrap">
                atau daftar dengan
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium"
              >
                {/* Google icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium"
              >
                {/* Facebook icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
                Facebook
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium"
              >
                {/* Apple icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Apple
              </button>
            </div>

            {/* Terms */}
            <p className="mt-5 text-center text-xs text-gray-400 leading-relaxed">
              Dengan mendaftar, kamu menyetujui{" "}
              <Link
                href="/terms"
                className="text-gray-600 font-semibold hover:underline"
              >
                Syarat &amp; Ketentuan
              </Link>{" "}
              dan{" "}
              <Link
                href="/privacy"
                className="text-gray-600 font-semibold hover:underline"
              >
                Kebijakan Privasi
              </Link>{" "}
              GUEPOSTING
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
