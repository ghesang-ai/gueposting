"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">

        <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
          Kembali ke login
        </Link>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gueposting-icon-red.png" alt="GUEPOSTING" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span className="font-black text-xl tracking-tight" style={{ fontFamily: "var(--font-brand)", color: "#d42b2b" }}>GUEPOSTING</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Lupa Password?</h1>
          <p className="text-muted-foreground text-sm">
            GUEPOSTING adalah platform invite-only. Reset password dilakukan oleh admin.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-amber-800">Cara reset password:</p>
          <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside">
            <li>Hubungi admin GUEPOSTING melalui WhatsApp atau email</li>
            <li>Berikan username atau email akunmu</li>
            <li>Admin akan reset password sementara untukmu</li>
            <li>Login dengan password sementara, lalu ganti di Edit Profil</li>
          </ol>
        </div>

        <div className="space-y-3">
          <a
            href="mailto:ghesang@gmail.com?subject=Reset Password GUEPOSTING"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#d42b2b] text-white font-bold rounded-xl hover:bg-[#c0281f] transition-colors"
          >
            <Mail size={16} />
            Email Admin
          </a>
          <Link
            href="/login"
            className="flex items-center justify-center w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Kembali ke Login
          </Link>
        </div>

      </div>
    </div>
  );
}
