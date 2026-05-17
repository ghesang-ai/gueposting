"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, underscore"),
  displayName: z.string().min(1).max(60),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Minimal 8 karakter"),
});

type FormData = z.infer<typeof schema>;

export default function SetupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError("");
      const res = await api.post("/auth/setup", data);
      setAuth(res.data.user, res.data.token);
      router.push("/admin");
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(msg ?? "Setup gagal.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gueposting-icon-red.png" alt="GUEPOSTING" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <span className="font-black text-xl tracking-tight" style={{ fontFamily: "var(--font-brand)", color: "#d42b2b" }}>GUEPOSTING</span>
          </div>
          <h1 className="text-2xl font-bold">Setup Admin</h1>
          <p className="text-muted-foreground text-sm">
            Buat akun admin pertama untuk GUEPOSTING.<br />
            Halaman ini hanya bisa dipakai sekali.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="admin" {...register("username")} />
            {errors.username && <p className="text-destructive text-xs">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Nama Tampil</Label>
            <Input id="displayName" placeholder="Nama Admin" {...register("displayName")} />
            {errors.displayName && <p className="text-destructive text-xs">{errors.displayName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@email.com" {...register("email")} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Minimal 8 karakter" {...register("password")} />
            {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
          </div>

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Membuat akun..." : "Buat Akun Admin"}
          </Button>
        </form>
      </div>
    </div>
  );
}
