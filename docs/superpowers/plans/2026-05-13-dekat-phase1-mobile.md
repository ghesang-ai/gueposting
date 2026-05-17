# DEKAT Phase 1 — Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build React Native + Expo mobile app untuk DEKAT Phase 1 — iOS dan Android dengan semua fitur Phase 1 termasuk kamera, media upload, push notification, dan AI Compare.

**Architecture:** Expo Router (file-based routing) dengan route groups `(auth)` dan `(app)`. TanStack Query untuk data fetching. Expo Camera + ImagePicker untuk media. Expo Notifications untuk push notification via FCM. NativeWind untuk styling konsisten dengan web.

**Tech Stack:** React Native + Expo SDK 52, Expo Router v4, TypeScript 5, NativeWind v4, TanStack Query v5, Expo Camera, Expo ImagePicker, Expo Notifications, Socket.io Client, @dekat/types (shared)

**Prerequisite:** Backend API harus sudah berjalan dan accessible dari device/simulator.

---

## File Structure

```
apps/mobile/
├── app/
│   ├── _layout.tsx                   # Root layout + providers
│   ├── index.tsx                     # Redirect → /(app)/feed
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/
│       ├── _layout.tsx               # Tab navigator
│       ├── feed.tsx                  # For You feed
│       ├── gadgets.tsx               # Gadgets list
│       ├── compare/
│       │   ├── index.tsx             # Compare selector
│       │   └── [id].tsx              # Compare result
│       ├── communities.tsx
│       ├── profile/
│       │   ├── index.tsx             # Own profile
│       │   └── [username].tsx        # Other user profile
│       └── post/
│           ├── new.tsx               # Create post
│           └── [id].tsx              # Post detail
├── components/
│   ├── PostCard.tsx
│   ├── GadgetCard.tsx
│   ├── ScoreBar.tsx
│   ├── CompareResultCard.tsx
│   └── Avatar.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useFeed.ts
│   └── useCompare.ts
├── lib/
│   ├── api.ts
│   └── storage.ts                    # SecureStore wrapper
├── providers/
│   └── QueryProvider.tsx
├── app.json
├── babel.config.js
├── tailwind.config.js
└── package.json
```

---

## Task 1: Expo Project Setup

**Files:**
- Create: `apps/mobile/` (full Expo project)
- Create: `apps/mobile/lib/api.ts`
- Create: `apps/mobile/lib/storage.ts`
- Create: `apps/mobile/providers/QueryProvider.tsx`

- [ ] **Step 1: Scaffold Expo app**

```bash
cd apps
npx create-expo-app mobile --template blank-typescript
cd mobile
```

- [ ] **Step 2: Install Expo Router**

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-safe-area-context react-native-screens
```

- [ ] **Step 3: Install semua dependencies**

```bash
# Data & API
npx expo install @tanstack/react-query axios

# Auth & Storage
npx expo install expo-secure-store

# Media
npx expo install expo-image-picker expo-camera expo-media-library

# Notifications
npx expo install expo-notifications expo-device

# Navigation & UI
npx expo install expo-blur expo-haptics

# Styling
pnpm add nativewind
pnpm add -D tailwindcss

# Shared types
pnpm add "@dekat/types@workspace:*"

# Socket.io
pnpm add socket.io-client
```

- [ ] **Step 4: Setup NativeWind**

```javascript
// apps/mobile/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6e6af0',
          dark: '#4f4cc8',
        },
      },
    },
  },
};
```

```javascript
// apps/mobile/babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

- [ ] **Step 5: Setup app.json untuk Expo Router**

```json
// apps/mobile/app.json
{
  "expo": {
    "name": "DEKAT",
    "slug": "dekat",
    "version": "1.0.0",
    "scheme": "dekat",
    "web": { "bundler": "metro" },
    "plugins": [
      "expo-router",
      [
        "expo-camera",
        { "cameraPermission": "DEKAT perlu akses kamera untuk foto & video." }
      ],
      [
        "expo-image-picker",
        { "photosPermission": "DEKAT perlu akses galeri untuk upload media." }
      ],
      [
        "expo-notifications",
        { "icon": "./assets/notification-icon.png", "color": "#6e6af0" }
      ]
    ],
    "android": {
      "adaptiveIcon": { "foregroundImage": "./assets/adaptive-icon.png", "backgroundColor": "#000000" },
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "id.dekat.app"
    }
  }
}
```

- [ ] **Step 6: Buat storage wrapper (SecureStore)**

```typescript
// apps/mobile/lib/storage.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'dekat_token';

export const storage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
```

- [ ] **Step 7: Buat API client**

```typescript
// apps/mobile/lib/api.ts
import axios from 'axios';
import { storage } from './storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // 401 handling dilakukan di AuthProvider
    return Promise.reject(error);
  },
);

export default api;
```

- [ ] **Step 8: Buat QueryProvider**

```typescript
// apps/mobile/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
    }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 9: Buat .env**

```bash
# apps/mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:3001/api/v1
# Ganti dengan IP lokal saat test di device fisik:
# EXPO_PUBLIC_API_URL=http://192.168.1.x:3001/api/v1
```

- [ ] **Step 10: Commit**

```bash
git add apps/mobile/
git commit -m "feat: expo mobile app setup with router, nativewind, and api client"
```

---

## Task 2: Auth Hook & Root Layout

**Files:**
- Create: `apps/mobile/hooks/useAuth.ts`
- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/index.tsx`

- [ ] **Step 1: Buat useAuth hook**

```typescript
// apps/mobile/hooks/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import api from '@/lib/api';

interface LoginParams { email: string; password: string; }
interface RegisterParams { email: string; password: string; username: string; displayName: string; }

export function useAuth() {
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = await storage.getToken();
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
    onSuccess: async ({ accessToken }) => {
      await storage.setToken(accessToken);
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      router.replace('/(app)/feed');
    },
  });

  const register = useMutation({
    mutationFn: async (params: RegisterParams) => {
      const { data } = await api.post('/auth/register', params);
      return data as { accessToken: string };
    },
    onSuccess: async ({ accessToken }) => {
      await storage.setToken(accessToken);
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      router.replace('/(app)/feed');
    },
  });

  const logout = async () => {
    await storage.removeToken();
    qc.clear();
    router.replace('/(auth)/login');
  };

  return { user, isLoading, login, register, logout };
}
```

- [ ] **Step 2: Root layout**

```typescript
// apps/mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }} />
    </QueryProvider>
  );
}
```

- [ ] **Step 3: Index redirect**

```typescript
// apps/mobile/app/index.tsx
import { Redirect } from 'expo-router';
export default function Index() { return <Redirect href="/(app)/feed" />; }
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/ apps/mobile/hooks/
git commit -m "feat: auth hook and root layout for expo router"
```

---

## Task 3: Auth Screens (Login & Register)

**Files:**
- Create: `apps/mobile/app/(auth)/_layout.tsx`
- Create: `apps/mobile/app/(auth)/login.tsx`
- Create: `apps/mobile/app/(auth)/register.tsx`

- [ ] **Step 1: Auth layout**

```typescript
// apps/mobile/app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }} />
  );
}
```

- [ ] **Step 2: Login screen**

```typescript
// apps/mobile/app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Isi email dan password'); return; }
    login.mutate({ email, password }, {
      onError: () => Alert.alert('Login Gagal', 'Email atau password salah'),
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo */}
        <View className="mb-8 items-center">
          <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
            <Text className="text-2xl font-bold text-white">D</Text>
          </View>
          <Text className="text-2xl font-bold text-white">DEKAT</Text>
          <Text className="mt-1 text-sm text-white/40">Gadget Social Network</Text>
        </View>

        {/* Form */}
        <View className="w-full space-y-3">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="email-address"
            autoCapitalize="none"
            className="rounded-2xl bg-white/5 px-4 py-4 text-white border border-white/10"
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.3)"
            secureTextEntry
            className="rounded-2xl bg-white/5 px-4 py-4 text-white border border-white/10 mt-3"
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={login.isPending}
            className="mt-4 rounded-2xl bg-indigo-600 py-4 items-center"
          >
            <Text className="font-semibold text-white">
              {login.isPending ? 'Masuk...' : 'Masuk'}
            </Text>
          </TouchableOpacity>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-sm text-white/40">Belum punya akun? </Text>
            <Link href="/(auth)/register">
              <Text className="text-sm text-indigo-400">Daftar dengan invite</Text>
            </Link>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 3: Register screen**

```typescript
// apps/mobile/app/(auth)/register.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    inviteCode: '', email: '', username: '', displayName: '', password: '',
  });

  const handleRegister = async () => {
    if (!form.inviteCode || !form.email || !form.username || !form.displayName || !form.password) {
      Alert.alert('Error', 'Semua kolom wajib diisi'); return;
    }
    if (form.password.length < 8) {
      Alert.alert('Error', 'Password minimal 8 karakter'); return;
    }
    try {
      await api.post('/invites/redeem', { code: form.inviteCode });
    } catch {
      // lanjut register meskipun redeem gagal
    }
    register.mutate(
      { email: form.email, password: form.password, username: form.username, displayName: form.displayName },
      { onError: (e: any) => Alert.alert('Gagal', e.response?.data?.message ?? 'Registrasi gagal') },
    );
  };

  const fields: Array<{ key: keyof typeof form; placeholder: string; secure?: boolean; keyboard?: any; autoCapitalize?: any }> = [
    { key: 'inviteCode', placeholder: 'Kode Invite (DEKAT-XXXXXXXX)', autoCapitalize: 'characters' },
    { key: 'email', placeholder: 'Email', keyboard: 'email-address', autoCapitalize: 'none' },
    { key: 'username', placeholder: 'Username (a-z, 0-9, _)', autoCapitalize: 'none' },
    { key: 'displayName', placeholder: 'Nama Tampilan' },
    { key: 'password', placeholder: 'Password (min 8 karakter)', secure: true },
  ];

  return (
    <ScrollView className="flex-1 bg-black" contentContainerStyle={{ padding: 24 }}>
      <View className="items-center mb-8 mt-12">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 mb-3">
          <Text className="text-xl font-bold text-white">D</Text>
        </View>
        <Text className="text-2xl font-bold text-white">Daftar ke DEKAT</Text>
      </View>

      <View className="space-y-3">
        {fields.map(({ key, placeholder, secure, keyboard, autoCapitalize }) => (
          <TextInput
            key={key}
            value={form[key]}
            onChangeText={(v) => setForm((p) => ({ ...p, [key]: v }))}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.3)"
            secureTextEntry={secure}
            keyboardType={keyboard}
            autoCapitalize={autoCapitalize ?? 'words'}
            className="rounded-2xl bg-white/5 px-4 py-4 text-white border border-white/10 mb-3"
          />
        ))}

        <TouchableOpacity
          onPress={handleRegister}
          disabled={register.isPending}
          className="rounded-2xl bg-indigo-600 py-4 items-center mt-2"
        >
          <Text className="font-semibold text-white">
            {register.isPending ? 'Mendaftar...' : 'Daftar'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-4">
          <Text className="text-sm text-white/40">Sudah punya akun? </Text>
          <Link href="/(auth)/login">
            <Text className="text-sm text-indigo-400">Masuk</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/(auth)/
git commit -m "feat: login and register screens for mobile"
```

---

## Task 4: App Tab Layout + Protected Route

**Files:**
- Create: `apps/mobile/app/(app)/_layout.tsx`

- [ ] **Step 1: Tab navigator dengan auth guard**

```typescript
// apps/mobile/app/(app)/_layout.tsx
import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Home, Search, Cpu, Users, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

function TabIcon({ Icon, focused }: { Icon: any; focused: boolean }) {
  return <Icon size={22} color={focused ? '#fff' : 'rgba(255,255,255,0.3)'} strokeWidth={focused ? 2.5 : 1.5} />;
}

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.replace('/(auth)/login');
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color="#6e6af0" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 64,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="feed" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} /> }} />
      <Tabs.Screen name="gadgets" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Search} focused={focused} /> }} />
      <Tabs.Screen name="compare/index" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Cpu} focused={focused} /> }} />
      <Tabs.Screen name="communities" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Users} focused={focused} /> }} />
      <Tabs.Screen name="profile/index" options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} /> }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Install lucide-react-native**

```bash
cd apps/mobile
pnpm add lucide-react-native react-native-svg
npx expo install react-native-svg
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(app)/_layout.tsx
git commit -m "feat: tab navigator with auth guard"
```

---

## Task 5: Feed Screen + PostCard

**Files:**
- Create: `apps/mobile/components/PostCard.tsx`
- Create: `apps/mobile/hooks/useFeed.ts`
- Create: `apps/mobile/app/(app)/feed.tsx`

- [ ] **Step 1: useFeed hook**

```typescript
// apps/mobile/hooks/useFeed.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
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
```

- [ ] **Step 2: PostCard component**

```typescript
// apps/mobile/components/PostCard.tsx
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Heart, MessageCircle, Bookmark } from 'lucide-react-native';
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
    gadget?: { name: string };
  };
}

export function PostCard({ post }: PostCardProps) {
  const { mutate: toggleLike } = useToggleLike();

  return (
    <View className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-3">
        <View className="h-9 w-9 rounded-full bg-indigo-600 items-center justify-center">
          {post.user.avatarUrl
            ? <Image source={{ uri: post.user.avatarUrl }} className="h-9 w-9 rounded-full" />
            : <Text className="text-sm font-bold text-white">{post.user.displayName[0]}</Text>
          }
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-white">{post.user.displayName}</Text>
            {post.user.trustScore >= 7 && (
              <View className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5">
                <Text className="text-[9px] font-semibold text-indigo-400">Real User</Text>
              </View>
            )}
          </View>
          <Text className="text-[11px] text-white/30">@{post.user.username}</Text>
        </View>
        {post.gadget && <Text className="text-xs text-white/30">{post.gadget.name}</Text>}
      </View>

      {/* Rating */}
      {post.rating && (
        <View className="flex-row mb-2">
          {[1,2,3,4,5].map((s) => (
            <Text key={s} className="text-sm">{s <= post.rating! ? '⭐' : '☆'}</Text>
          ))}
        </View>
      )}

      {/* Content */}
      <Text className="text-sm text-white/80 leading-relaxed mb-3" numberOfLines={4}>
        {post.content}
      </Text>

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {post.mediaUrls.map((url, i) => (
            <Image key={i} source={{ uri: url }} className="h-40 w-56 rounded-xl mr-2" resizeMode="cover" />
          ))}
        </ScrollView>
      )}

      {/* Actions */}
      <View className="flex-row items-center gap-4">
        <TouchableOpacity onPress={() => toggleLike(post.id)} className="flex-row items-center gap-1.5">
          <Heart size={16} color="rgba(255,255,255,0.3)" />
          {post.likeCount > 0 && <Text className="text-xs text-white/30">{post.likeCount}</Text>}
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center gap-1.5">
          <MessageCircle size={16} color="rgba(255,255,255,0.3)" />
          {post.commentCount > 0 && <Text className="text-xs text-white/30">{post.commentCount}</Text>}
        </TouchableOpacity>
        <TouchableOpacity className="ml-auto">
          <Bookmark size={16} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Feed screen**

```typescript
// apps/mobile/app/(app)/feed.tsx
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/PostCard';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FeedScreen() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFeed();
  const posts = data?.pages.flat() ?? [];

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center gap-3 border-b border-white/5">
        <View className="h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <View className="h-3 w-3 rounded-sm bg-white" />
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#6e6af0" />
        }
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator color="#6e6af0" className="py-4" /> : null
        }
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/
git commit -m "feat: feed screen with infinite scroll and post card"
```

---

## Task 6: Create Post dengan Kamera & Gallery

**Files:**
- Create: `apps/mobile/app/(app)/post/new.tsx`

- [ ] **Step 1: Create post screen dengan media picker**

```typescript
// apps/mobile/app/(app)/post/new.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ImagePlus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/lib/api';

type PostType = 'review' | 'discussion' | 'photo' | 'video';

export default function NewPostScreen() {
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [type, setType] = useState<PostType>('review');
  const [rating, setRating] = useState(0);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: 4,
      quality: 0.8,
    });
    if (result.canceled) return;

    setUploading(true);
    for (const asset of result.assets) {
      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        type: asset.mimeType ?? 'image/jpeg',
        name: asset.fileName ?? 'upload.jpg',
      } as any);
      try {
        const { data } = await api.post('/media/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMediaUrls((p) => [...p, data.url]);
      } catch {
        Alert.alert('Upload gagal', 'Coba lagi');
      }
    }
    setUploading(false);
  };

  const createPost = useMutation({
    mutationFn: () =>
      api.post('/posts', { content, type, rating: rating || undefined, mediaUrls }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      router.back();
    },
    onError: () => Alert.alert('Gagal', 'Post tidak bisa dibuat'),
  });

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5">
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-white">Buat Post</Text>
        <TouchableOpacity
          onPress={() => createPost.mutate()}
          disabled={!content.trim() || createPost.isPending}
          className="rounded-full bg-indigo-600 px-4 py-1.5 disabled:opacity-40"
        >
          <Text className="text-sm font-semibold text-white">
            {createPost.isPending ? '...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {(['review','discussion','photo','video'] as PostType[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              className={`rounded-full px-3 py-1.5 mr-2 ${type === t ? 'bg-indigo-600' : 'bg-white/5'}`}
            >
              <Text className={`text-xs font-medium capitalize ${type === t ? 'text-white' : 'text-white/40'}`}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Rating */}
        {type === 'review' && (
          <View className="flex-row mb-4">
            {[1,2,3,4,5].map((s) => (
              <TouchableOpacity key={s} onPress={() => setRating(s)} className="mr-1">
                <Text className="text-2xl">{s <= rating ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Content */}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder={type === 'review' ? 'Ceritakan pengalamanmu...' : 'Apa yang ingin kamu bagikan?'}
          placeholderTextColor="rgba(255,255,255,0.25)"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          className="rounded-2xl bg-white/5 p-4 text-white text-sm leading-relaxed mb-4"
          style={{ minHeight: 120 }}
        />

        {/* Media preview */}
        {mediaUrls.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {mediaUrls.map((url, i) => (
              <View key={i} className="relative">
                <Image source={{ uri: url }} className="h-24 w-24 rounded-xl" resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setMediaUrls((p) => p.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full bg-black border border-white/20"
                >
                  <X size={10} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Media button */}
        <TouchableOpacity
          onPress={pickMedia}
          disabled={uploading || mediaUrls.length >= 4}
          className="flex-row items-center gap-2 rounded-xl bg-white/5 p-3"
        >
          {uploading
            ? <ActivityIndicator size="small" color="#6e6af0" />
            : <ImagePlus size={18} color="rgba(255,255,255,0.4)" />
          }
          <Text className="text-sm text-white/40">
            {uploading ? 'Mengupload...' : 'Tambah Foto / Video'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/app/(app)/post/
git commit -m "feat: create post screen with camera gallery and media upload"
```

---

## Task 7: AI Compare Screen

**Files:**
- Create: `apps/mobile/hooks/useCompare.ts`
- Create: `apps/mobile/components/ScoreBar.tsx`
- Create: `apps/mobile/components/CompareResultCard.tsx`
- Create: `apps/mobile/app/(app)/compare/index.tsx`
- Create: `apps/mobile/app/(app)/compare/[id].tsx`

- [ ] **Step 1: useCompare hook**

```typescript
// apps/mobile/hooks/useCompare.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useStartCompare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { gadgetIds: string[]; userBudget?: number; userUsecase?: string }) =>
      api.post('/ai/compare', params).then((r) => r.data as { id: string }),
    onSuccess: ({ id }) => qc.invalidateQueries({ queryKey: ['compare', id] }),
  });
}

export function useCompareResult(id?: string) {
  return useQuery({
    queryKey: ['compare', id],
    queryFn: async () => { const { data } = await api.get(`/ai/compare/${id}`); return data; },
    enabled: !!id,
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.status;
      return status === 'pending' || status === 'processing' ? 3000 : false;
    },
  });
}
```

- [ ] **Step 2: ScoreBar component**

```typescript
// apps/mobile/components/ScoreBar.tsx
import { View, Text } from 'react-native';

interface Props { label: string; score: number; justification?: string; color?: string; }

export function ScoreBar({ label, score, justification, color = 'bg-indigo-500' }: Props) {
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-xs text-white/50">{label}</Text>
        <Text className="text-xs font-semibold text-white">{score.toFixed(1)}</Text>
      </View>
      <View className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <View className={`h-full rounded-full ${color}`} style={{ width: `${score * 10}%` }} />
      </View>
      {justification && <Text className="mt-1 text-[10px] text-white/25 leading-relaxed">{justification}</Text>}
    </View>
  );
}
```

- [ ] **Step 3: Compare selector screen**

```typescript
// apps/mobile/app/(app)/compare/index.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Cpu, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStartCompare } from '@/hooks/useCompare';
import api from '@/lib/api';

export default function CompareScreen() {
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
      Alert.alert('Maksimal 3 device');
    }
  };

  const handleCompare = () => {
    if (selected.length < 2) { Alert.alert('Pilih minimal 2 device'); return; }
    startCompare(
      { gadgetIds: selected.map((s) => s.id), userBudget: budget ? parseInt(budget) : undefined, userUsecase: usecase || undefined },
      { onSuccess: ({ id }) => router.push(`/(app)/compare/${id}`) },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-xl font-bold text-white mb-1">AI Compare</Text>
        <Text className="text-sm text-white/40 mb-5">Pilih 2–3 device untuk dibandingkan</Text>

        {selected.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {selected.map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => toggle(g)}
                className="flex-row items-center gap-1.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 mr-2"
              >
                <Text className="text-xs font-medium text-indigo-300">{g.name}</Text>
                <X size={10} color="#818cf8" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Cari gadget..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          className="rounded-2xl bg-white/5 px-4 py-3.5 text-white border border-white/10 mb-4"
        />

        {gadgets && (
          <View className="mb-4">
            {gadgets.filter((g) => !selected.find((s) => s.id === g.id)).map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => toggle(g)}
                className="flex-row items-center gap-3 rounded-xl py-3 border-b border-white/5"
              >
                <Cpu size={18} color="#6e6af0" />
                <View>
                  <Text className="text-sm font-medium text-white">{g.name}</Text>
                  <Text className="text-xs text-white/40">{g.brand}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selected.length >= 2 && (
          <View className="rounded-2xl border border-white/5 p-4 mb-4 space-y-3">
            <TextInput value={budget} onChangeText={setBudget}
              placeholder="Budget (opsional)" placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              className="rounded-xl bg-white/5 px-4 py-3 text-white border border-white/10 mb-2" />
            <TextInput value={usecase} onChangeText={setUsecase}
              placeholder="Kebutuhan utama (opsional)" placeholderTextColor="rgba(255,255,255,0.3)"
              className="rounded-xl bg-white/5 px-4 py-3 text-white border border-white/10" />
          </View>
        )}

        <TouchableOpacity
          onPress={handleCompare}
          disabled={selected.length < 2 || isPending}
          className="rounded-2xl bg-indigo-600 py-4 items-center mb-8 disabled:opacity-40"
        >
          <Text className="font-semibold text-white">
            {isPending ? 'Memproses...' : `Bandingkan ${selected.length} Device`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 4: Compare result screen**

```typescript
// apps/mobile/app/(app)/compare/[id].tsx
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCompareResult } from '@/hooks/useCompare';
import { ScoreBar } from '@/components/ScoreBar';
import api from '@/lib/api';
import { GadgetCompareScore } from '@dekat/types';

const CATEGORIES = [
  { key: 'camera', label: 'Kamera', color: 'bg-blue-500' },
  { key: 'battery', label: 'Baterai', color: 'bg-green-500' },
  { key: 'performance', label: 'Performa', color: 'bg-purple-500' },
  { key: 'display', label: 'Layar', color: 'bg-amber-500' },
  { key: 'ecosystem', label: 'Ekosistem', color: 'bg-rose-500' },
] as const;

export default function CompareResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: result } = useCompareResult(id);
  const gadgetIds = result?.gadgetIds ?? [];
  const { data: gadgets } = useQuery({
    queryKey: ['gadgets-detail', gadgetIds],
    queryFn: async () => {
      const results = await Promise.all(gadgetIds.map((gid: string) => api.get(`/gadgets/${gid}`)));
      return results.map((r) => r.data) as Array<{ id: string; name: string }>;
    },
    enabled: gadgetIds.length > 0,
  });

  if (!result) return <View className="flex-1 bg-black items-center justify-center"><ActivityIndicator color="#6e6af0" /></View>;

  if (result.status === 'pending' || result.status === 'processing') {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#6e6af0" />
        <Text className="text-white font-semibold mt-4">AI sedang menganalisis...</Text>
        <Text className="text-white/30 text-sm mt-1">Biasanya 10–20 detik</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Summary */}
        <View className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-4">
          <Text className="text-xs font-semibold text-indigo-400 mb-1">Ringkasan AI</Text>
          <Text className="text-sm text-white/70 leading-relaxed">{result.summary}</Text>
        </View>

        {/* Recommendation */}
        <View className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 mb-6">
          <Text className="text-xs font-semibold text-green-400 mb-1">🎯 Rekomendasi</Text>
          <Text className="text-sm text-white/70 leading-relaxed">{result.recommendation}</Text>
        </View>

        {/* Per gadget scores */}
        {gadgetIds.map((gid: string) => {
          const gadget = gadgets?.find((g) => g.id === gid);
          const score: GadgetCompareScore = result.scores[gid];
          if (!score || !gadget) return null;
          return (
            <View key={gid} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-sm font-semibold text-white">{gadget.name}</Text>
                <Text className="text-2xl font-bold text-indigo-400">{score.overall.toFixed(1)}<Text className="text-xs text-white/30">/10</Text></Text>
              </View>
              {CATEGORIES.map(({ key, label, color }) => (
                <ScoreBar key={key} label={label} score={score[key].score} justification={score[key].justification} color={color} />
              ))}
              <View className="mt-3 rounded-xl bg-white/[0.03] p-3">
                <Text className="text-[10px] font-semibold text-white/40 mb-2">Sentimen Komunitas · {score.sentimentScore.toFixed(1)}/10</Text>
                <Text className="text-[10px] font-semibold text-green-400 mb-1">👍 Dipuji</Text>
                {score.topPraises.map((p, i) => <Text key={i} className="text-[11px] text-white/40">• {p}</Text>)}
                <Text className="text-[10px] font-semibold text-red-400 mb-1 mt-2">👎 Dikeluhkan</Text>
                {score.topComplaints.map((c, i) => <Text key={i} className="text-[11px] text-white/40">• {c}</Text>)}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/
git commit -m "feat: AI compare screen with polling and score breakdown"
```

---

## Task 8: Push Notifications Setup

**Files:**
- Create: `apps/mobile/lib/notifications.ts`
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Buat notifications helper**

```typescript
// apps/mobile/lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DEKAT Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function saveFcmToken(): Promise<void> {
  const token = await registerForPushNotifications();
  if (token) {
    try {
      await api.patch('/auth/fcm-token', { fcmToken: token });
    } catch {
      // non-critical — log saja
    }
  }
}
```

- [ ] **Step 2: Register token saat user login**

```typescript
// Tambahkan di apps/mobile/app/(app)/_layout.tsx
// Di dalam AppLayout, setelah user terdeteksi:

import { useEffect } from 'react';
import { saveFcmToken } from '@/lib/notifications';

// Di dalam component:
useEffect(() => {
  if (user) saveFcmToken();
}, [user]);
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/notifications.ts apps/mobile/app/(app)/_layout.tsx
git commit -m "feat: push notification registration with FCM token"
```

---

## Task 9: Deploy dengan EAS Build

**Files:**
- Create: `apps/mobile/eas.json`

- [ ] **Step 1: Install EAS CLI**

```bash
npm install -g eas-cli
eas login
```

- [ ] **Step 2: Buat eas.json**

```json
// apps/mobile/eas.json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "http://localhost:3001/api/v1" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://dekat-api.railway.app/api/v1" }
    },
    "production": {
      "env": { "EXPO_PUBLIC_API_URL": "https://dekat-api.railway.app/api/v1" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

- [ ] **Step 3: Build untuk testing internal**

```bash
cd apps/mobile

# iOS simulator (macOS only)
npx expo run:ios

# Android emulator
npx expo run:android

# Build internal distribution (untuk test di device)
eas build --profile preview --platform all
```

- [ ] **Step 4: Final commit**

```bash
git add apps/mobile/eas.json
git commit -m "feat: EAS build config for iOS and Android deployment"
git tag v1.0.0-mobile
```

---

## Verifikasi Akhir Mobile

```bash
# Start dev server
cd apps/mobile
npx expo start

# Checklist di simulator/device:
# ✅ Login screen — form berfungsi, navigasi ke feed
# ✅ Register screen — invite code, semua field
# ✅ Tab navigation — 5 tab berfungsi
# ✅ Feed screen — post tampil, infinite scroll
# ✅ PostCard — like berfungsi, media tampil
# ✅ Create post — text + pick media dari galeri + upload
# ✅ Compare screen — search gadget, pilih 2+
# ✅ Compare result — polling spinner → hasil AI + score bars
# ✅ Push notification — izin muncul, token tersimpan
```
