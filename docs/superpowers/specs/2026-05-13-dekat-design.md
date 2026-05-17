# DEKAT — Gadget Social Network
**Design Document · v1.0 · 2026-05-13**

---

## Overview

DEKAT adalah platform sosial berbasis komunitas gadget untuk Indonesia. Pengguna dapat berbagi pengalaman nyata, review jujur, komparasi device, diskusi komunitas, dan mendapat rekomendasi berbasis AI.

**Positioning:** "The Gadget Social Network" — decision layer sebelum orang membeli gadget. Bukan forum (Kaskus), bukan grup jual-beli (Facebook Group), bukan marketplace biasa.

**Strategi growth:**
- Phase 1: Private, invite-only, 10–50 orang (internal + teman dekat)
- Phase 2: Waitlist publik, diapprove manual, ratusan–ribuan user
- Phase 3: Open registration, creator economy aktif

**Monetisasi:** Tidak ada sampai Phase 3 — komunitas harus tumbuh organik terlebih dahulu.

---

## Arsitektur Sistem

### Pendekatan: Monolith First (Opsi A)

Satu NestJS monolith dengan empat module utama. Supabase menangani auth dan storage. Saat Phase 3, module dapat dipisah menjadi microservice sesuai kebutuhan scaling.

```
Client Layer          Backend Layer           Data Layer
─────────────         ──────────────          ──────────
Next.js 14       ──►  NestJS Monolith    ──►  PostgreSQL (Supabase)
React Native     ──►  REST + WebSocket   ──►  Redis
                       │                 ──►  Supabase Storage
                       ├── Auth Module   ──►  OpenAI API
                       ├── Content Module
                       ├── Social Module
                       └── AI Module
```

### Client Layer

| Platform | Teknologi | Fungsi |
|----------|-----------|--------|
| Web App | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui | Dashboard user & admin, SSR/SSG |
| Mobile App | React Native + Expo + NativeWind | iOS & Android |
| Auth | Supabase Auth SDK | Google login, email, JWT session |
| Design System | Shared token warna & tipografi | Konsisten di web & mobile |

**Catatan:** Keduanya dibangun bersamaan dari Phase 1 dengan shared API. NativeWind memastikan styling konsisten antara web dan mobile.

### Backend Layer — NestJS Monolith

**Auth Module**
- `POST /auth/register` — register dengan email
- `POST /auth/login` — login email/password
- `POST /auth/social` — Google / Apple OAuth
- `POST /auth/refresh` — refresh JWT token
- `GET /auth/me` — profil user aktif
- JWT Guard middleware untuk semua endpoint protected
- Role-based access control: `user`, `admin`

**Content Module**
- `POST /posts` — buat post (teks, foto, video)
- `GET /posts/feed` — feed berdasarkan following & algoritma
- `GET /posts/:id` — detail post
- `PUT /posts/:id` — edit post milik sendiri
- `DELETE /posts/:id` — hapus post
- `POST /posts/:id/like` — toggle like
- `POST /posts/:id/comment` — tambah komentar
- `POST /media/upload` — upload foto/video ke Supabase Storage

**Social Module**
- `POST /users/:id/follow` — follow/unfollow user
- `GET /users/:id/profile` — profil publik user
- `GET /feed/for-you` — feed algoritmik (Phase 1: reverse-chronological dari following + komunitas yang diikuti. Phase 2: ranking berdasarkan engagement)
- `GET /feed/following` — feed reverse-chronological dari following
- `GET /feed/trending` — konten dengan engagement tertinggi dalam 24 jam
- `GET /communities` — daftar komunitas
- `POST /communities/:id/join` — join komunitas
- WebSocket gateway untuk notifikasi real-time

**AI Module**
- `POST /ai/compare` — mulai AI comparison (async)
- `GET /ai/compare/:id` — ambil hasil comparison
- `POST /ai/recommend` — rekomendasi personal
- `GET /gadgets/:id/sentiment` — sentiment analysis dari review komunitas
- Async job queue via Bull + Redis
- OpenAI GPT-4o sebagai engine utama

### Data Layer

| Teknologi | Peran |
|-----------|-------|
| PostgreSQL (via Supabase) | Primary database — semua entitas |
| Redis | Cache API response, session store, Bull queue |
| Supabase Storage | File media (foto & video) + CDN global |
| OpenAI API | GPT-4o untuk AI Compare, sentiment, rekomendasi |
| Firebase FCM | Push notification iOS & Android |

---

## Fitur AI Compare (Full)

AI Compare adalah killer feature DEKAT — empat komponen yang bekerja bersama:

### 1. Spec Comparison Engine
User input dua atau lebih device. AI menarik spec dari database gadget dan menyusun perbandingan terstruktur per kategori:
- **Kamera** — resolusi, aperture, fitur kamera
- **Baterai** — kapasitas, charging speed, ketahanan
- **Performa** — chipset, RAM, benchmark
- **Layar** — ukuran, resolusi, refresh rate, teknologi panel
- **Ekosistem** — OS, app availability, accessory support

### 2. Community Sentiment Analysis
AI membaca semua review dari komunitas DEKAT untuk device tersebut dan menghasilkan:
- Sentiment score (0–10)
- Top 3 keluhan paling umum dari user nyata
- Top 3 pujian paling umum dari user nyata

### 3. Personal Recommendation
Berdasarkan profil user (gadget yang dimiliki, konten yang disukai, budget yang diinput), AI merekomendasikan device mana yang paling cocok beserta alasan spesifik.

Input yang digunakan:
- Budget user (input manual)
- Use case utama (foto, gaming, produktivitas, dll)
- Gadget yang sudah dimiliki (ekosistem compatibility)

### 4. Score Breakdown
Setiap device mendapat skor 0–10 per kategori yang digabung menjadi Overall Score. Transparan — user bisa lihat justifikasi AI per poin skor.

**Flow teknis:**
```
User request → Bull Queue → Worker process → OpenAI GPT-4o
→ Parse response → Store result → Notify user via WebSocket
```

---

## Database Schema (Core Tables)

### users
```sql
id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
username      varchar(30) UNIQUE NOT NULL
display_name  varchar(60) NOT NULL
email         varchar(255) UNIQUE NOT NULL
avatar_url    text
bio           text
trust_score   float DEFAULT 0  -- kalkulasi: (jumlah review × 0.4) + (like diterima × 0.3) + (akun terverifikasi × 0.3), skala 0–10
role          enum('user', 'admin') DEFAULT 'user'
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

### posts
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid NOT NULL REFERENCES users(id)
gadget_id   uuid REFERENCES gadgets(id)
content     text NOT NULL
type        enum('review', 'photo', 'video', 'discussion')
rating      int CHECK (rating BETWEEN 1 AND 5)
media_urls  text[] DEFAULT '{}'
like_count  int DEFAULT 0
comment_count int DEFAULT 0
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

### gadgets
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        varchar(100) NOT NULL
brand       varchar(50) NOT NULL
category    enum('smartphone', 'laptop', 'tablet', 'wearable', 'audio', 'other')
specs       jsonb NOT NULL DEFAULT '{}'
avg_score   float DEFAULT 0
image_url   text
review_count int DEFAULT 0
created_at  timestamptz DEFAULT now()
```

### ai_comparisons
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES users(id)
gadget_ids      uuid[] NOT NULL
scores          jsonb DEFAULT '{}'
summary         text
recommendation  text
user_budget     int
user_usecase    text
status          enum('pending', 'processing', 'done', 'failed') DEFAULT 'pending'
created_at      timestamptz DEFAULT now()
```

### follows
```sql
follower_id   uuid NOT NULL REFERENCES users(id)
following_id  uuid NOT NULL REFERENCES users(id)
created_at    timestamptz DEFAULT now()
PRIMARY KEY (follower_id, following_id)
```

### communities
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        varchar(100) NOT NULL
slug        varchar(100) UNIQUE NOT NULL
description text
gadget_id   uuid REFERENCES gadgets(id)
member_count int DEFAULT 0
created_at  timestamptz DEFAULT now()
```

### invites
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
code        varchar(20) UNIQUE NOT NULL
created_by  uuid NOT NULL REFERENCES users(id)
used_by     uuid REFERENCES users(id)
used_at     timestamptz
expires_at  timestamptz NOT NULL
created_at  timestamptz DEFAULT now()
```

---

## Fitur Per Phase

### Phase 1 — Private Sharing (Bulan 1–3)
Target: 10–50 user · Invite-only

- Auth (email + Google login)
- Profil user + daftar gadget yang dimiliki
- Feed review teks + foto + video
- Like, komentar, bookmark
- Follow user
- Komunitas & grup per gadget
- **AI Compare — full 4 komponen**
- Gadget database (manual seed awal)
- Invite link system
- Push notification dasar

### Phase 2 — Public Platform (Bulan 4–6)
Target: Ratusan–ribuan user · Waitlist publik

- Waitlist publik + manual approve
- Trust Score & verifikasi user
- Trending feed & hashtag
- Search gadget & user
- Direct Message
- Laporan konten + moderasi
- Public analytics dashboard
- Dark / Light mode
- SEO — halaman publik review gadget

### Phase 3 — Creator Economy (Bulan 7–12)
Target: Open · Tidak terbatas

- Creator dashboard
- Affiliate link generator
- Commission tracking
- Withdrawal via Xendit / Midtrans
- Marketplace integration
- Advanced AI rekomendasi
- PostHog + Mixpanel analytics penuh
- Open registration
- Public API untuk partner
- Verified device badge

---

## Tech Stack Lengkap

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Web Frontend | Next.js | 14 (App Router) |
| Mobile | React Native + Expo | SDK 51+ |
| Styling Web | Tailwind CSS + shadcn/ui | latest |
| Styling Mobile | NativeWind | v4 |
| Backend | NestJS | v10 |
| ORM | Prisma | v5 |
| Database | PostgreSQL via Supabase | 15 |
| Cache / Queue | Redis + Bull | latest |
| Auth | Supabase Auth | latest |
| Storage | Supabase Storage | latest |
| AI | OpenAI GPT-4o | API v1 |
| Push Notif | Firebase FCM | latest |
| Email | Resend | latest |
| Deploy Backend | Railway atau Fly.io | — |
| Deploy Web | Vercel | — |

---

## User Roles

| Role | Akses |
|------|-------|
| `user` | Semua fitur sosial, AI Compare, posting konten |
| `admin` | Semua akses user + moderasi, verifikasi, analytics |

Phase 3 akan menambah role `creator` dengan akses ke affiliate dashboard.

---

## Tim Phase 1

| Role | Tanggung Jawab |
|------|----------------|
| Full-stack Lead | NestJS monolith, Prisma schema, deploy (Railway/Fly.io) |
| Frontend Web | Next.js 14, semua UI web, design system |
| Mobile Engineer | React Native + Expo, screens, media upload, push notif |
| AI / Product | OpenAI prompt engineering, AI Compare logic, gadget database seed, QA |

---

## Keputusan Desain Utama

1. **Monolith dulu, microservice nanti** — untuk 10–50 user Phase 1, monolith jauh lebih cepat dibangun. Setiap NestJS module sudah dirancang dengan boundary yang jelas sehingga dapat dipisah saat Phase 3.

2. **Web + Mobile bersamaan** — menggunakan shared NestJS API dan shared design token agar tidak ada duplikasi logic.

3. **AI Compare full dari Phase 1** — ini adalah killer feature yang membedakan DEKAT dari semua platform lain. Harus ada sejak hari pertama untuk validasi dengan 10–50 user awal.

4. **Tidak ada monetisasi sampai Phase 3** — komunitas harus organik. Creator economy baru dibuka setelah ada volume user dan engagement yang genuine.

5. **Supabase untuk auth & storage, bukan semua backend** — Supabase dipakai hanya sebagai managed PostgreSQL, auth provider, dan object storage. Business logic tetap di NestJS agar tidak vendor lock-in.

6. **Invite system di Phase 1** — setiap user mendapat beberapa invite code yang bisa dibagikan. Ini menjaga kualitas komunitas awal dan menciptakan sense of exclusivity.
