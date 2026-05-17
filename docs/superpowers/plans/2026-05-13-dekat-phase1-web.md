# DEKAT Phase 1 — Web Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Next.js 14 web app untuk DEKAT Phase 1 — semua screen dari auth hingga AI Compare, terhubung ke NestJS API backend.

**Architecture:** Next.js 14 App Router dengan route groups `(auth)` dan `(app)`. TanStack Query untuk data fetching & caching. Supabase Auth untuk session client-side. Socket.io client untuk real-time notifications. shadcn/ui sebagai komponen dasar.

**Tech Stack:** Next.js 14, TypeScript 5, Tailwind CSS 3, shadcn/ui, TanStack Query v5, Supabase JS v2, Socket.io Client, React Hook Form + Zod, @dekat/types (shared)

**Prerequisite:** Backend API harus sudah berjalan di `http://localhost:3001/api/v1`

---

## File Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (font, provider)
│   │   ├── page.tsx                      # Redirect → /feed
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                # Auth layout (centered card)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── invite/page.tsx           # Redeem invite code
│   │   └── (app)/
│   │       ├── layout.tsx                # App shell (sidebar + topbar)
│   │       ├── feed/page.tsx             # For You / Following tabs
│   │       ├── post/
│   │       │   ├── new/page.tsx          # Create post
│   │       │   └── [id]/page.tsx         # Post detail + comments
│   │       ├── gadgets/
│   │       │   ├── page.tsx              # Gadgets list + search
│   │       │   └── [id]/page.tsx         # Gadget detail + reviews
│   │       ├── compare/
│   │       │   ├── page.tsx              # Compare selector
│   │       │   └── [id]/page.tsx         # Compare result
│   │       ├── communities/
│   │       │   ├── page.tsx              # Communities list
│   │       │   └── [slug]/page.tsx       # Community detail + feed
│   │       ├── profile/
│   │       │   ├── page.tsx              # Own profile
│   │       │   └── [username]/page.tsx   # Other user profile
│   │       ├── bookmarks/page.tsx
│   │       └── notifications/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx               # Desktop sidebar
│   │   │   ├── BottomNav.tsx             # Mobile bottom navigation
│   │   │   └── TopBar.tsx                # Mobile topbar
│   │   ├── post/
│   │   │   ├── PostCard.tsx              # Single post in feed
│   │   │   ├── PostFeed.tsx              # Infinite scroll feed
│   │   │   └── CreatePostForm.tsx        # Create post modal/page
│   │   ├── gadget/
│   │   │   ├── GadgetCard.tsx
│   │   │   └── GadgetSearchCombobox.tsx  # Searchable gadget picker
│   │   ├── compare/
│   │   │   ├── CompareSelector.tsx       # Pick 2-3 gadgets
│   │   │   ├── ScoreBar.tsx              # Visual score per category
│   │   │   └── CompareResultCard.tsx     # Full result display
│   │   └── ui/                           # shadcn/ui components (auto-generated)
│   ├── lib/
│   │   ├── api.ts                        # Axios instance + interceptors
│   │   ├── supabase.ts                   # Supabase client
│   │   └── socket.ts                     # Socket.io client singleton
│   ├── hooks/
│   │   ├── useAuth.ts                    # Auth state + token management
│   │   ├── useFeed.ts                    # Infinite feed query
│   │   ├── useCompare.ts                 # AI Compare polling hook
│   │   └── useSocket.ts                  # WebSocket connection hook
│   ├── providers/
│   │   ├── QueryProvider.tsx             # TanStack Query provider
│   │   └── AuthProvider.tsx              # Auth context
│   └── types/
│       └── api.ts                        # API response types
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Task 1: Next.js 14 Setup

**Files:**
- Create: `apps/web/` (full Next.js project)
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/supabase.ts`
- Create: `apps/web/src/providers/QueryProvider.tsx`
- Create: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd apps
npx create-next-app@latest web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

- [ ] **Step 2: Install dependencies**

```bash
cd apps/web

pnpm add @tanstack/react-query axios
pnpm add @supabase/supabase-js
pnpm add socket.io-client
pnpm add react-hook-form @hookform/resolvers zod
pnpm add sonner                    # toast notifications
pnpm add lucide-react
pnpm add clsx tailwind-merge
pnpm add "@dekat/types@workspace:*"

pnpm add -D @tanstack/react-query-devtools
```

- [ ] **Step 3: Init shadcn/ui**

```bash
npx shadcn@latest init
# Pilih: Default style, Zinc color, CSS variables: yes
```

Add komponen yang dibutuhkan:
```bash
npx shadcn@latest add button card avatar badge input textarea tabs dialog sheet skeleton
```

- [ ] **Step 4: Buat API client**

```typescript
// apps/web/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Inject token dari localStorage ke setiap request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dekat_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect ke /login jika 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('dekat_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

- [ ] **Step 5: Buat Supabase client**

```typescript
// apps/web/src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

- [ ] **Step 6: Buat QueryProvider**

```typescript
// apps/web/src/providers/QueryProvider.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30 * 1000, retry: 1 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 7: Setup root layout**

```typescript
// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DEKAT — Gadget Social Network',
  description: 'Platform komunitas gadget Indonesia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Buat .env.local**

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 9: Verify server berjalan**

```bash
pnpm dev
```

Expected: Server running on `http://localhost:3000`

- [ ] **Step 10: Commit**

```bash
git add apps/web/
git commit -m "feat: next.js 14 web app setup with tailwind, shadcn, tanstack query"
```

---

## Task 2: Auth Hook & Provider

**Files:**
- Create: `apps/web/src/hooks/useAuth.ts`
- Create: `apps/web/src/providers/AuthProvider.tsx`
- Create: `apps/web/src/app/(app)/layout.tsx`

- [ ] **Step 1: Buat useAuth hook**

```typescript
// apps/web/src/hooks/useAuth.ts
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  trustScore: number;
  role: string;
}

interface LoginParams { email: string; password: string; }
interface RegisterParams { email: string; password: string; username: string; displayName: string; }

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = localStorage.getItem('dekat_token');
      if (!token) return null;
      const { data } = await api.get('/auth/me');
      return data;
    },
    retry: false,
  });

  const login = useMutation({
    mutationFn: async (params: LoginParams) => {
      const { data } = await api.post('/auth/login', params);
      return data as { accessToken: string };
    },
    onSuccess: ({ accessToken }) => {
      localStorage.setItem('dekat_token', accessToken);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      router.push('/feed');
    },
    onError: () => toast.error('Email atau password salah'),
  });

  const register = useMutation({
    mutationFn: async (params: RegisterParams) => {
      const { data } = await api.post('/auth/register', params);
      return data as { accessToken: string };
    },
    onSuccess: ({ accessToken }) => {
      localStorage.setItem('dekat_token', accessToken);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      router.push('/feed');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Registrasi gagal'),
  });

  const logout = () => {
    localStorage.removeItem('dekat_token');
    queryClient.clear();
    router.push('/login');
  };

  return { user, isLoading, login, register, logout };
}
```

- [ ] **Step 2: Buat protected app layout**

```typescript
// apps/web/src/app/(app)/layout.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar user={user} />
      <main className="flex-1 pb-16 md:pb-0 md:pl-64">
        <div className="mx-auto max-w-2xl px-4 py-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 3: Buat auth layout**

```typescript
// apps/web/src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">
            D
          </div>
          <h1 className="text-2xl font-bold text-white">DEKAT</h1>
          <p className="mt-1 text-sm text-white/40">Gadget Social Network</p>
        </div>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks/ apps/web/src/app/
git commit -m "feat: auth hook with login/register/logout + protected layout"
```

---

## Task 3: Auth Screens (Login, Register, Invite)

**Files:**
- Create: `apps/web/src/app/(auth)/login/page.tsx`
- Create: `apps/web/src/app/(auth)/register/page.tsx`
- Create: `apps/web/src/app/(auth)/invite/page.tsx`
- Create: `apps/web/src/app/page.tsx`

- [ ] **Step 1: Root redirect**

```typescript
// apps/web/src/app/page.tsx
import { redirect } from 'next/navigation';
export default function Home() { redirect('/feed'); }
```

- [ ] **Step 2: Login page**

```typescript
// apps/web/src/app/(auth)/login/page.tsx
'use client';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((d) => login.mutate(d))} className="space-y-4">
      <div>
        <Input
          {...register('email')}
          type="email"
          placeholder="Email"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
      </div>
      <div>
        <Input
          {...register('password')}
          type="password"
          placeholder="Password"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
        />
        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
      </div>
      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-500"
        disabled={isSubmitting || login.isPending}
      >
        {login.isPending ? 'Masuk...' : 'Masuk'}
      </Button>
      <p className="text-center text-sm text-white/40">
        Belum punya akun?{' '}
        <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
          Daftar dengan invite
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 3: Register page**

```typescript
// apps/web/src/app/(auth)/register/page.tsx
'use client';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  inviteCode: z.string().min(1, 'Kode invite wajib diisi'),
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Hanya huruf kecil, angka, _'),
  displayName: z.string().min(2).max(60),
  password: z.string().min(8, 'Minimal 8 karakter'),
});
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    // 1. Redeem invite code first
    const { default: api } = await import('@/lib/api');
    try {
      await api.post('/invites/redeem', { code: data.inviteCode });
    } catch {
      // kode mungkin bisa dipakai setelah register — tergantung flow backend
    }
    // 2. Register
    authRegister.mutate({
      email: data.email,
      password: data.password,
      username: data.username,
      displayName: data.displayName,
    });
  };

  const fields: Array<{ name: keyof Form; label: string; type?: string }> = [
    { name: 'inviteCode', label: 'Kode Invite (DEKAT-XXXXXXXX)' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'username', label: 'Username (@namauser)' },
    { name: 'displayName', label: 'Nama Tampilan' },
    { name: 'password', label: 'Password', type: 'password' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {fields.map(({ name, label, type = 'text' }) => (
        <div key={name}>
          <Input
            {...register(name)}
            type={type}
            placeholder={label}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
          {errors[name] && (
            <p className="mt-1 text-xs text-red-400">{errors[name]?.message}</p>
          )}
        </div>
      ))}
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500" disabled={isSubmitting}>
        {isSubmitting ? 'Mendaftar...' : 'Daftar'}
      </Button>
      <p className="text-center text-sm text-white/40">
        Sudah punya akun?{' '}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Masuk</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/
git commit -m "feat: auth screens — login, register with invite code"
```

---

## Task 4: Sidebar & Navigation

**Files:**
- Create: `apps/web/src/components/layout/Sidebar.tsx`
- Create: `apps/web/src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Sidebar desktop**

```typescript
// apps/web/src/components/layout/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Users, Bookmark, Bell, User, Cpu, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/feed',         icon: Home,     label: 'Beranda' },
  { href: '/gadgets',      icon: Search,   label: 'Gadget' },
  { href: '/compare',      icon: Cpu,      label: 'AI Compare' },
  { href: '/communities',  icon: Users,    label: 'Komunitas' },
  { href: '/bookmarks',    icon: Bookmark, label: 'Tersimpan' },
  { href: '/notifications',icon: Bell,     label: 'Notifikasi' },
];

export function Sidebar({ user }: { user: { username: string; displayName: string; avatarUrl?: string } }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-white/5 bg-black px-4 py-6 md:flex">
      {/* Brand */}
      <Link href="/feed" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">D</div>
        <span className="text-lg font-bold text-white">DEKAT</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-white/8 text-white'
                : 'text-white/50 hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="mt-4 space-y-1">
        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 hover:bg-white/5 hover:text-white transition-colors"
        >
          <User className="h-5 w-5" />
          {user.displayName}
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/30 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Bottom navigation mobile**

```typescript
// apps/web/src/components/layout/BottomNav.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Cpu, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/feed',        icon: Home,   label: 'Home' },
  { href: '/gadgets',     icon: Search, label: 'Gadget' },
  { href: '/compare',     icon: Cpu,    label: 'Compare' },
  { href: '/communities', icon: Users,  label: 'Komunitas' },
  { href: '/profile',     icon: User,   label: 'Profil' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-black/95 backdrop-blur-md md:hidden">
      <div className="flex">
        {items.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors',
              pathname.startsWith(href) ? 'text-white' : 'text-white/30',
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/layout/
git commit -m "feat: sidebar desktop and bottom navigation mobile"
```

---

## Task 5: Feed Page

**Files:**
- Create: `apps/web/src/hooks/useFeed.ts`
- Create: `apps/web/src/components/post/PostCard.tsx`
- Create: `apps/web/src/components/post/PostFeed.tsx`
- Create: `apps/web/src/app/(app)/feed/page.tsx`

- [ ] **Step 1: Feed hook dengan infinite scroll**

```typescript
// apps/web/src/hooks/useFeed.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'for-you'],
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      const { data } = await api.get(`/posts/feed${params}`);
      return data as Array<any>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length < 20) return undefined;
      return lastPage[lastPage.length - 1].id;
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.post(`/posts/${postId}/like`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      api.post(`/posts/${postId}/comment`, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}
```

- [ ] **Step 2: PostCard component**

```typescript
// apps/web/src/components/post/PostCard.tsx
'use client';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Heart, MessageCircle, Bookmark, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToggleLike } from '@/hooks/useFeed';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    type: string;
    rating?: number;
    mediaUrls: string[];
    likeCount: number;
    commentCount: number;
    createdAt: string;
    user: { id: string; username: string; displayName: string; avatarUrl?: string; trustScore: number };
    gadget?: { id: string; name: string; brand: string; imageUrl?: string };
  };
}

export function PostCard({ post }: PostCardProps) {
  const { mutate: toggleLike } = useToggleLike();

  return (
    <article className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={post.user.avatarUrl} />
          <AvatarFallback className="bg-indigo-600 text-xs text-white">
            {post.user.displayName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{post.user.displayName}</span>
            {post.user.trustScore >= 7 && (
              <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0 text-[10px] text-indigo-400">
                Real User
              </Badge>
            )}
          </div>
          <span className="text-xs text-white/30">
            @{post.user.username} · {formatDistanceToNow(new Date(post.createdAt), { locale: id, addSuffix: true })}
          </span>
        </div>
        {post.gadget && (
          <span className="text-xs text-white/40 shrink-0">{post.gadget.name}</span>
        )}
      </div>

      {/* Rating stars */}
      {post.rating && (
        <div className="mb-2 flex gap-0.5">
          {[1,2,3,4,5].map((s) => (
            <Star
              key={s}
              className={`h-3.5 w-3.5 ${s <= post.rating! ? 'fill-amber-400 text-amber-400' : 'text-white/15'}`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <p className="mb-3 text-sm leading-relaxed text-white/80 line-clamp-4">{post.content}</p>

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <div className={`mb-3 grid gap-1 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.mediaUrls.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="aspect-video w-full rounded-xl object-cover" />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 text-white/30">
        <button
          onClick={() => toggleLike(post.id)}
          className="flex items-center gap-1.5 text-xs hover:text-red-400 transition-colors"
        >
          <Heart className="h-4 w-4" />
          {post.likeCount > 0 && post.likeCount}
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-white transition-colors">
          <MessageCircle className="h-4 w-4" />
          {post.commentCount > 0 && post.commentCount}
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-indigo-400 transition-colors ml-auto">
          <Bookmark className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Feed page**

```typescript
// apps/web/src/app/(app)/feed/page.tsx
'use client';
import { useEffect, useRef } from 'react';
import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/post/PostCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeedPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasNextPage) fetchNextPage(); },
      { threshold: 0.5 },
    );
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  const posts = data?.pages.flat() ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 text-center text-white/30">
        <p className="text-sm">Belum ada postingan.</p>
        <p className="mt-1 text-xs">Follow teman atau buat post pertama kamu!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
      <div ref={bottomRef} className="py-4 text-center text-xs text-white/20">
        {isFetchingNextPage ? 'Memuat...' : hasNextPage ? '' : 'Semua post sudah dimuat'}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Install date-fns**

```bash
cd apps/web && pnpm add date-fns
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/
git commit -m "feat: feed page with infinite scroll and post card"
```

---

## Task 6: Create Post & Post Detail

**Files:**
- Create: `apps/web/src/components/post/CreatePostForm.tsx`
- Create: `apps/web/src/app/(app)/post/new/page.tsx`
- Create: `apps/web/src/app/(app)/post/[id]/page.tsx`

- [ ] **Step 1: Create post form**

```typescript
// apps/web/src/components/post/CreatePostForm.tsx
'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ImagePlus, Video, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

export function CreatePostForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [type, setType] = useState<'review' | 'discussion' | 'photo' | 'video'>('review');
  const [rating, setRating] = useState(0);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMediaUrls((prev) => [...prev, data.url]);
    } catch {
      toast.error('Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  const createPost = useMutation({
    mutationFn: () =>
      api.post('/posts', { content, type, rating: rating || undefined, mediaUrls }),
    onSuccess: () => {
      toast.success('Post berhasil dibuat!');
      qc.invalidateQueries({ queryKey: ['feed'] });
      router.push('/feed');
    },
    onError: () => toast.error('Gagal membuat post'),
  });

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-2">
        {(['review','discussion','photo','video'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
              type === t ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Rating stars for review */}
      {type === 'review' && (
        <div className="flex gap-1">
          {[1,2,3,4,5].map((s) => (
            <button key={s} onClick={() => setRating(s)} className="text-xl">
              {s <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={type === 'review' ? 'Ceritakan pengalamanmu dengan gadget ini...' : 'Apa yang ingin kamu bagikan?'}
        rows={5}
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
      />

      {/* Media preview */}
      {mediaUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="aspect-square rounded-lg object-cover w-full" />
              <button
                onClick={() => setMediaUrls((p) => p.filter((_, j) => j !== i))}
                className="absolute -right-1 -top-1 rounded-full bg-black p-0.5"
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
        </div>
        <Button
          onClick={() => createPost.mutate()}
          disabled={!content.trim() || createPost.isPending}
          className="bg-indigo-600 hover:bg-indigo-500 px-6"
        >
          {createPost.isPending ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create post page & detail page**

```typescript
// apps/web/src/app/(app)/post/new/page.tsx
import { CreatePostForm } from '@/components/post/CreatePostForm';

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-white">Buat Post</h1>
      <CreatePostForm />
    </div>
  );
}
```

```typescript
// apps/web/src/app/(app)/post/[id]/page.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { PostCard } from '@/components/post/PostCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => { const { data } = await api.get(`/posts/${id}`); return data; },
  });

  if (isLoading) return <Skeleton className="h-40 rounded-2xl bg-white/5" />;
  if (!post) return <p className="text-white/30">Post tidak ditemukan</p>;

  return (
    <div className="space-y-4">
      <PostCard post={post} />
      <div className="space-y-3">
        {post.comments?.map((c: any) => (
          <div key={c.id} className="flex gap-3 rounded-xl bg-white/[0.02] p-3">
            <span className="text-sm font-semibold text-indigo-400">{c.user.displayName}</span>
            <span className="text-sm text-white/70">{c.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/
git commit -m "feat: create post form with media upload and post detail page"
```

---

## Task 7: AI Compare UI

**Files:**
- Create: `apps/web/src/hooks/useCompare.ts`
- Create: `apps/web/src/components/compare/CompareSelector.tsx`
- Create: `apps/web/src/components/compare/CompareResultCard.tsx`
- Create: `apps/web/src/components/compare/ScoreBar.tsx`
- Create: `apps/web/src/app/(app)/compare/page.tsx`
- Create: `apps/web/src/app/(app)/compare/[id]/page.tsx`

- [ ] **Step 1: Compare hook dengan polling**

```typescript
// apps/web/src/hooks/useCompare.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ComparisonScores } from '@dekat/types';

interface CompareResult {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  gadgetIds: string[];
  scores: ComparisonScores;
  summary: string;
  recommendation: string;
}

export function useStartCompare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { gadgetIds: string[]; userBudget?: number; userUsecase?: string }) =>
      api.post('/ai/compare', params).then((r) => r.data as { id: string }),
    onSuccess: ({ id }) => qc.invalidateQueries({ queryKey: ['compare', id] }),
  });
}

export function useCompareResult(id?: string) {
  return useQuery<CompareResult>({
    queryKey: ['compare', id],
    queryFn: async () => { const { data } = await api.get(`/ai/compare/${id}`); return data; },
    enabled: !!id,
    // Poll every 3 seconds saat status pending/processing
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 3000 : false;
    },
  });
}
```

- [ ] **Step 2: Score bar component**

```typescript
// apps/web/src/components/compare/ScoreBar.tsx
interface ScoreBarProps {
  label: string;
  score: number;
  justification?: string;
  color?: string;
}

export function ScoreBar({ label, score, justification, color = 'bg-indigo-500' }: ScoreBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-semibold text-white">{score.toFixed(1)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      {justification && <p className="text-[11px] text-white/30 leading-relaxed">{justification}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Compare result card**

```typescript
// apps/web/src/components/compare/CompareResultCard.tsx
import { ScoreBar } from './ScoreBar';
import { GadgetCompareScore } from '@dekat/types';

interface Props {
  gadgetName: string;
  score: GadgetCompareScore;
}

const categories = [
  { key: 'camera', label: 'Kamera', color: 'bg-blue-500' },
  { key: 'battery', label: 'Baterai', color: 'bg-green-500' },
  { key: 'performance', label: 'Performa', color: 'bg-purple-500' },
  { key: 'display', label: 'Layar', color: 'bg-amber-500' },
  { key: 'ecosystem', label: 'Ekosistem', color: 'bg-rose-500' },
] as const;

export function CompareResultCard({ gadgetName, score }: Props) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">{gadgetName}</h3>
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-indigo-400">{score.overall.toFixed(1)}</span>
          <span className="text-xs text-white/30">/10</span>
        </div>
      </div>

      {/* Category scores */}
      <div className="mb-5 space-y-3">
        {categories.map(({ key, label, color }) => (
          <ScoreBar
            key={key}
            label={label}
            score={score[key].score}
            justification={score[key].justification}
            color={color}
          />
        ))}
      </div>

      {/* Sentiment */}
      <div className="mb-4 rounded-xl bg-white/[0.03] p-3">
        <p className="mb-2 text-xs font-medium text-white/40">Sentimen Komunitas · {score.sentimentScore.toFixed(1)}/10</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-1 text-[10px] font-semibold text-green-400">👍 Yang Dipuji</p>
            {score.topPraises.map((p, i) => <p key={i} className="text-[11px] text-white/50">• {p}</p>)}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold text-red-400">👎 Yang Dikeluhkan</p>
            {score.topComplaints.map((c, i) => <p key={i} className="text-[11px] text-white/50">• {c}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Compare page**

```typescript
// apps/web/src/app/(app)/compare/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Cpu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useStartCompare } from '@/hooks/useCompare';

export default function ComparePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Array<{ id: string; name: string; brand: string }>>([]);
  const [budget, setBudget] = useState('');
  const [usecase, setUsecase] = useState('');
  const { mutate: startCompare, isPending } = useStartCompare();

  const { data: gadgets } = useQuery({
    queryKey: ['gadgets', search],
    queryFn: async () => {
      const { data } = await api.get(`/gadgets?search=${search}`);
      return data as Array<{ id: string; name: string; brand: string }>;
    },
    enabled: search.length > 1,
  });

  const toggle = (g: { id: string; name: string; brand: string }) => {
    if (selected.find((s) => s.id === g.id)) {
      setSelected((p) => p.filter((s) => s.id !== g.id));
    } else if (selected.length < 3) {
      setSelected((p) => [...p, g]);
    } else {
      toast.error('Maksimal 3 device sekaligus');
    }
  };

  const handleCompare = () => {
    if (selected.length < 2) { toast.error('Pilih minimal 2 device'); return; }
    startCompare(
      { gadgetIds: selected.map((s) => s.id), userBudget: budget ? parseInt(budget) : undefined, userUsecase: usecase || undefined },
      { onSuccess: ({ id }) => router.push(`/compare/${id}`) },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">AI Compare</h1>
        <p className="mt-1 text-sm text-white/40">Pilih 2–3 device untuk dibandingkan oleh AI</p>
      </div>

      {/* Selected */}
      {selected.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {selected.map((g) => (
            <div key={g.id} className="flex items-center gap-2 rounded-full bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5">
              <span className="text-xs font-medium text-indigo-300">{g.name}</span>
              <button onClick={() => toggle(g)}><X className="h-3 w-3 text-indigo-400" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari gadget..."
        className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
      />
      {gadgets && (
        <div className="space-y-1">
          {gadgets.filter((g) => !selected.find((s) => s.id === g.id)).map((g) => (
            <button
              key={g.id}
              onClick={() => toggle(g)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <Cpu className="h-4 w-4 text-indigo-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">{g.name}</p>
                <p className="text-xs text-white/40">{g.brand}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Optional filters */}
      {selected.length >= 2 && (
        <div className="space-y-3 rounded-2xl border border-white/5 p-4">
          <Input value={budget} onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget (contoh: 10000000)" type="number"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          <Input value={usecase} onChange={(e) => setUsecase(e.target.value)}
            placeholder="Kebutuhan utama (contoh: fotografi, gaming)"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>
      )}

      <Button
        onClick={handleCompare}
        disabled={selected.length < 2 || isPending}
        className="w-full bg-indigo-600 hover:bg-indigo-500 h-11"
      >
        {isPending ? 'Memproses...' : `Bandingkan ${selected.length} Device`}
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Compare result page dengan polling**

```typescript
// apps/web/src/app/(app)/compare/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CompareResultCard } from '@/components/compare/CompareResultCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompareResult } from '@/hooks/useCompare';
import api from '@/lib/api';

export default function CompareResultPage() {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading } = useCompareResult(id);

  const gadgetIds = result?.gadgetIds ?? [];
  const { data: gadgets } = useQuery({
    queryKey: ['gadgets-by-ids', gadgetIds],
    queryFn: async () => {
      const results = await Promise.all(gadgetIds.map((gid) => api.get(`/gadgets/${gid}`)));
      return results.map((r) => r.data) as Array<{ id: string; name: string; brand: string }>;
    },
    enabled: gadgetIds.length > 0,
  });

  if (isLoading) return <Skeleton className="h-40 rounded-2xl bg-white/5" />;

  if (!result) return <p className="text-white/30">Perbandingan tidak ditemukan</p>;

  if (result.status === 'pending' || result.status === 'processing') {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-white font-medium">AI sedang menganalisis...</p>
        <p className="text-sm text-white/30">Biasanya selesai dalam 10–20 detik</p>
      </div>
    );
  }

  if (result.status === 'failed') {
    return <p className="text-red-400 text-sm">Analisis gagal. Silakan coba lagi.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <p className="text-sm font-medium text-indigo-300 mb-1">Ringkasan AI</p>
        <p className="text-sm text-white/70 leading-relaxed">{result.summary}</p>
      </div>

      {/* Recommendation */}
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
        <p className="text-sm font-medium text-green-400 mb-1">🎯 Rekomendasi</p>
        <p className="text-sm text-white/70 leading-relaxed">{result.recommendation}</p>
      </div>

      {/* Scores per gadget */}
      <div className="space-y-4">
        {gadgetIds.map((gid) => {
          const gadget = gadgets?.find((g) => g.id === gid);
          const score = result.scores[gid];
          if (!score || !gadget) return null;
          return <CompareResultCard key={gid} gadgetName={gadget.name} score={score} />;
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/
git commit -m "feat: AI compare page with gadget selector, polling, and score breakdown"
```

---

## Task 8: Gadgets, Profile & Communities Pages

**Files:**
- Create: `apps/web/src/app/(app)/gadgets/page.tsx`
- Create: `apps/web/src/app/(app)/gadgets/[id]/page.tsx`
- Create: `apps/web/src/app/(app)/profile/[username]/page.tsx`
- Create: `apps/web/src/app/(app)/profile/page.tsx`
- Create: `apps/web/src/app/(app)/communities/page.tsx`
- Create: `apps/web/src/app/(app)/bookmarks/page.tsx`

- [ ] **Step 1: Gadgets list page**

```typescript
// apps/web/src/app/(app)/gadgets/page.tsx
'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Cpu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export default function GadgetsPage() {
  const [search, setSearch] = useState('');
  const { data: gadgets, isLoading } = useQuery({
    queryKey: ['gadgets', search],
    queryFn: async () => {
      const { data } = await api.get(`/gadgets?search=${search}`);
      return data as Array<{ id: string; name: string; brand: string; avgScore: number; imageUrl?: string }>;
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Gadget</h1>
      <Input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari gadget..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
      <div className="space-y-2">
        {isLoading ? <p className="text-white/30 text-sm">Memuat...</p> :
          gadgets?.map((g) => (
            <Link key={g.id} href={`/gadgets/${g.id}`}
              className="flex items-center gap-3 rounded-xl border border-white/5 p-3 hover:bg-white/5 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                {g.imageUrl ? <img src={g.imageUrl} alt={g.name} className="h-8 w-8 object-contain" />
                  : <Cpu className="h-5 w-5 text-indigo-400" />}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{g.name}</p>
                <p className="text-xs text-white/40">{g.brand}</p>
              </div>
              {g.avgScore > 0 && (
                <span className="ml-auto text-sm font-semibold text-indigo-400">{g.avgScore.toFixed(1)}</span>
              )}
            </Link>
          ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Profile page**

```typescript
// apps/web/src/app/(app)/profile/[username]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '@/components/post/PostCard';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: me } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => { const { data } = await api.get(`/users/${username}`); return data; },
  });
  const { data: posts } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: async () => { const { data } = await api.get(`/posts/feed`); return data; },
    enabled: !!profile,
  });
  const toggleFollow = useMutation({
    mutationFn: () => api.post(`/users/${username}/follow`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', username] }),
  });

  if (!profile) return null;
  const isMe = me?.username === username;

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatarUrl} />
            <AvatarFallback className="bg-indigo-600 text-xl text-white">{profile.displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">{profile.displayName}</h2>
              {profile.trustScore >= 7 && (
                <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-xs">Verified</Badge>
              )}
            </div>
            <p className="text-sm text-white/40">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-sm text-white/60">{profile.bio}</p>}
            <div className="mt-3 flex gap-4 text-xs text-white/40">
              <span><strong className="text-white">{profile._count?.posts}</strong> Post</span>
              <span><strong className="text-white">{profile._count?.followers}</strong> Follower</span>
              <span><strong className="text-white">{profile._count?.following}</strong> Following</span>
            </div>
          </div>
        </div>
        {!isMe && (
          <Button onClick={() => toggleFollow.mutate()}
            variant={profile.isFollowing ? 'outline' : 'default'}
            className={`mt-4 w-full ${!profile.isFollowing ? 'bg-indigo-600 hover:bg-indigo-500' : 'border-white/10 text-white hover:bg-white/5'}`}>
            {profile.isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {(posts ?? []).map((post: any) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Communities page**

```typescript
// apps/web/src/app/(app)/communities/page.tsx
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

export default function CommunitiesPage() {
  const qc = useQueryClient();
  const { data: communities } = useQuery({
    queryKey: ['communities'],
    queryFn: async () => { const { data } = await api.get('/communities'); return data; },
  });
  const toggleMember = useMutation({
    mutationFn: (id: string) => api.post(`/communities/${id}/join`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communities'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Komunitas</h1>
      <div className="space-y-3">
        {communities?.map((c: any) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{c.name}</p>
              <p className="text-xs text-white/40">{c.memberCount} anggota</p>
            </div>
            <Button size="sm" onClick={() => toggleMember.mutate(c.id)}
              variant="outline" className="border-white/10 text-white text-xs hover:bg-white/5">
              Gabung
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Bookmarks page**

```typescript
// apps/web/src/app/(app)/bookmarks/page.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { PostCard } from '@/components/post/PostCard';
import api from '@/lib/api';

export default function BookmarksPage() {
  const { data: bookmarks } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => { const { data } = await api.get('/posts/bookmarks/me'); return data; },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Tersimpan</h1>
      {bookmarks?.length === 0 && <p className="text-sm text-white/30">Belum ada post tersimpan</p>}
      <div className="space-y-3">
        {bookmarks?.map((b: any) => <PostCard key={b.postId} post={b.post} />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/
git commit -m "feat: gadgets, profile, communities, and bookmarks pages"
```

---

## Task 9: Deploy ke Vercel

**Files:**
- Create: `apps/web/vercel.json`

- [ ] **Step 1: Buat vercel.json**

```json
// apps/web/vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://dekat-api.railway.app/api/:path*" }
  ]
}
```

- [ ] **Step 2: Deploy ke Vercel**

```bash
cd apps/web
npx vercel --prod
```

Set environment variables di Vercel dashboard:
- `NEXT_PUBLIC_API_URL` = URL Railway backend
- `NEXT_PUBLIC_SUPABASE_URL` = Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key

- [ ] **Step 3: Final commit**

```bash
git add apps/web/
git commit -m "feat: vercel deployment config for web frontend"
git tag v1.0.0-web
```

---

## Verifikasi Akhir Web

```bash
# Dev server
cd apps/web && pnpm dev

# Checklist manual:
# ✅ /login — form login berfungsi
# ✅ /register — form registrasi dengan invite code
# ✅ /feed — menampilkan post, infinite scroll
# ✅ Post card — like, komentar terlihat
# ✅ /compare — pilih gadget, submit
# ✅ /compare/[id] — polling & tampil hasil AI
# ✅ /gadgets — list + search
# ✅ /communities — list + join
# ✅ /profile/[username] — tampil profil + follow
# ✅ /bookmarks — tampil post tersimpan
```
