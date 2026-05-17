"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth";
import { Star, GitCompare, Users, Shield, Smartphone, ArrowRight } from "lucide-react";

const features = [
  { icon: Star, title: "Review Jujur", desc: "Ulasan asli dari pengguna nyata, bukan iklan. Cari tahu gadget terbaik sebelum beli." },
  { icon: GitCompare, title: "AI Compare", desc: "Bandingkan dua gadget dengan AI. Dapat skor, rekomendasi, dan analisis mendalam." },
  { icon: Users, title: "Komunitas Gadget", desc: "Bergabung dengan sesama pecinta gadget Indonesia. Share unboxing, tips, dan pengalaman." },
  { icon: Shield, title: "Member Terpercaya", desc: "Komunitas berkualitas dengan sistem verifikasi member. Bebas dari spam dan akun palsu." },
];

const gadgets = [
  { name: "iPhone 17 Pro Max", brand: "Apple", emoji: "📱", score: "4.8" },
  { name: "Galaxy S25 Ultra", brand: "Samsung", emoji: "📲", score: "4.7" },
  { name: "MacBook Pro M4", brand: "Apple", emoji: "💻", score: "4.9" },
  { name: "Pixel 9 Pro", brand: "Google", emoji: "📷", score: "4.6" },
];

export default function LandingPage() {
  const { token, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && token) router.replace("/feed");
  }, [token, _hasHydrated, router]);

  if (!_hasHydrated) return null;
  if (token) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
            <img src="/gueposting-icon-red.png" alt="GUEPOSTING" className="h-8 w-8 object-contain" />
            <span className="font-black text-xl tracking-tight" style={{ fontFamily: "var(--font-brand)", color: "#d42b2b" }}>GUEPOSTING</span>
          </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground font-medium">Masuk</Link>
          <Link href="/register" className="inline-flex items-center justify-center rounded-md bg-foreground text-background text-sm font-medium px-4 py-2 hover:bg-foreground/90 transition-colors">Daftar Gratis</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-1.5 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Komunitas gadget Indonesia
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
          Review, Bandingkan,<br />
          dan Temukan Gadget<br />
          <span className="text-muted-foreground">Terbaik Kamu</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          Komunitas eksklusif untuk pecinta gadget Indonesia. Baca ulasan jujur, bandingkan dengan AI, dan berbagi pengalaman.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center rounded-md bg-foreground text-background text-base font-medium px-8 py-3 hover:bg-foreground/90 transition-colors gap-2">
            Bergabung Sekarang <ArrowRight size={16} />
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center rounded-md border border-input text-base font-medium px-8 py-3 hover:bg-muted transition-colors">
            Sudah punya akun
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Gratis selamanya · Komunitas terpercaya</p>
      </section>

      {/* Gadget preview cards */}
      <section className="px-6 pb-16 max-w-2xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {gadgets.map((g) => (
            <div key={g.name} className="border border-border rounded-2xl p-4 bg-muted/30 flex items-start gap-3">
              <span className="text-3xl">{g.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{g.name}</p>
                <p className="text-xs text-muted-foreground">{g.brand}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={10} fill="currentColor" className="text-amber-400" />
                  <span className="text-xs font-medium">{g.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-border bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Kenapa GUEPOSTING?</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-10">Cara Bergabung</h2>
        <div className="flex flex-col sm:flex-row gap-8 justify-center">
          {[
            { step: "1", title: "Daftar", desc: "Buat akun gratis dengan email dan username kamu" },
            { step: "2", title: "Verifikasi", desc: "Admin akan approve akunmu dalam waktu singkat" },
            { step: "3", title: "Explore", desc: "Baca ulasan, bandingkan gadget, dan mulai posting!" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex-1">
              <div className="w-10 h-10 rounded-full bg-foreground text-background font-bold text-lg flex items-center justify-center mx-auto mb-3">
                {step}
              </div>
              <p className="font-semibold mb-1">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 border-t border-border text-center">
        <div className="max-w-md mx-auto">
          <Smartphone size={40} className="mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-3">Siap bergabung?</h2>
          <p className="text-muted-foreground mb-6 text-sm">Daftar sekarang dan jadi bagian dari komunitas gadget terpercaya Indonesia.</p>
          <Link href="/register" className="inline-flex items-center justify-center rounded-md bg-foreground text-background text-base font-medium w-full sm:w-auto px-10 py-3 hover:bg-foreground/90 transition-colors">
            Daftar Gratis Sekarang
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 GUEPOSTING · Komunitas gadget terpercaya Indonesia</p>
      </footer>
    </div>
  );
}
