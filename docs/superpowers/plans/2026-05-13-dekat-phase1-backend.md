# DEKAT Phase 1 — Backend API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build NestJS monolith API untuk DEKAT Phase 1 — auth, content, social, AI Compare, invite system, dan push notification untuk 10–50 user invite-only.

**Architecture:** Single NestJS monolith dengan empat module (Auth, Content, Social, AI). PostgreSQL via Supabase + Prisma ORM. Redis untuk cache & Bull job queue. OpenAI GPT-4o untuk AI Compare async. Supabase Storage untuk media.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 15 (Supabase), Redis 7, Bull 4, OpenAI SDK 4, Supabase JS v2, Firebase Admin SDK, Jest, TypeScript 5, pnpm workspaces

---

## File Structure

```
dekat/
├── apps/
│   ├── api/                          # NestJS backend (plan ini)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── guards/jwt.guard.ts
│   │   │   │   ├── guards/roles.guard.ts
│   │   │   │   ├── decorators/current-user.decorator.ts
│   │   │   │   └── dto/register.dto.ts, login.dto.ts
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── dto/update-profile.dto.ts
│   │   │   ├── gadgets/
│   │   │   │   ├── gadgets.module.ts
│   │   │   │   ├── gadgets.controller.ts
│   │   │   │   └── gadgets.service.ts
│   │   │   ├── posts/
│   │   │   │   ├── posts.module.ts
│   │   │   │   ├── posts.controller.ts
│   │   │   │   ├── posts.service.ts
│   │   │   │   └── dto/create-post.dto.ts
│   │   │   ├── media/
│   │   │   │   ├── media.module.ts
│   │   │   │   ├── media.controller.ts
│   │   │   │   └── media.service.ts
│   │   │   ├── social/
│   │   │   │   ├── social.module.ts
│   │   │   │   ├── social.controller.ts
│   │   │   │   └── social.service.ts
│   │   │   ├── communities/
│   │   │   │   ├── communities.module.ts
│   │   │   │   ├── communities.controller.ts
│   │   │   │   └── communities.service.ts
│   │   │   ├── invites/
│   │   │   │   ├── invites.module.ts
│   │   │   │   ├── invites.controller.ts
│   │   │   │   └── invites.service.ts
│   │   │   ├── ai/
│   │   │   │   ├── ai.module.ts
│   │   │   │   ├── ai.controller.ts
│   │   │   │   ├── ai.service.ts
│   │   │   │   ├── ai.processor.ts
│   │   │   │   └── dto/compare-request.dto.ts
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.module.ts
│   │   │   │   └── notifications.service.ts
│   │   │   └── gateway/
│   │   │       └── events.gateway.ts
│   │   ├── test/
│   │   │   ├── auth.e2e-spec.ts
│   │   │   └── app.e2e-spec.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── .env.example
│   │   ├── nest-cli.json
│   │   └── package.json
│   ├── web/                          # Next.js (plan terpisah)
│   └── mobile/                       # React Native (plan terpisah)
├── packages/
│   └── types/
│       ├── src/index.ts              # Shared TypeScript types
│       └── package.json
├── package.json
└── pnpm-workspace.yaml
```

---

## Task 1: Monorepo & Project Setup

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `packages/types/package.json`
- Create: `packages/types/src/index.ts`
- Create: `apps/api/package.json`
- Create: `apps/api/.env.example`

- [ ] **Step 1: Buat root monorepo**

```bash
mkdir dekat && cd dekat
git init
```

```json
// package.json (root)
{
  "name": "dekat",
  "private": true,
  "scripts": {
    "dev:api": "pnpm --filter api dev",
    "dev:web": "pnpm --filter web dev",
    "build:api": "pnpm --filter api build",
    "test:api": "pnpm --filter api test",
    "test:api:e2e": "pnpm --filter api test:e2e"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 2: Buat shared types package**

```json
// packages/types/package.json
{
  "name": "@dekat/types",
  "version": "0.0.1",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

```typescript
// packages/types/src/index.ts
export type UserRole = 'user' | 'admin';
export type PostType = 'review' | 'photo' | 'video' | 'discussion';
export type GadgetCategory = 'smartphone' | 'laptop' | 'tablet' | 'wearable' | 'audio' | 'other';
export type CompareStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface GadgetSpecs {
  camera?: string;
  battery?: string;
  processor?: string;
  display?: string;
  ram?: string;
  storage?: string;
  os?: string;
  price?: number;
  [key: string]: unknown;
}

export interface CategoryScore {
  score: number;
  justification: string;
}

export interface GadgetCompareScore {
  overall: number;
  camera: CategoryScore;
  battery: CategoryScore;
  performance: CategoryScore;
  display: CategoryScore;
  ecosystem: CategoryScore;
  sentimentScore: number;
  topComplaints: string[];
  topPraises: string[];
}

export interface ComparisonScores {
  [gadgetId: string]: GadgetCompareScore;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
```

- [ ] **Step 3: Buat NestJS app**

```bash
cd apps
npx @nestjs/cli new api --package-manager pnpm --skip-git
cd api
```

- [ ] **Step 4: Install semua dependencies**

```bash
cd apps/api

# Core
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add @nestjs/bull bull
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
pnpm add @prisma/client
pnpm add @supabase/supabase-js
pnpm add openai
pnpm add firebase-admin
pnpm add class-validator class-transformer
pnpm add bcryptjs
pnpm add nanoid@3

# Dev
pnpm add -D prisma @types/passport-jwt @types/bcryptjs @types/bull supertest @types/supertest
```

- [ ] **Step 5: Buat .env.example**

```bash
# apps/api/.env.example
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

JWT_SECRET="change-this-secret-minimum-32-chars"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

SUPABASE_URL="https://[PROJECT].supabase.co"
SUPABASE_SERVICE_KEY="your-service-role-key"
SUPABASE_STORAGE_BUCKET="dekat-media"

OPENAI_API_KEY="sk-..."

REDIS_URL="redis://localhost:6379"

FIREBASE_PROJECT_ID="dekat-app"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@dekat-app.iam.gserviceaccount.com"

PORT=3001
NODE_ENV="development"
```

- [ ] **Step 6: Commit**

```bash
cd ../..
git add .
git commit -m "feat: monorepo setup with NestJS api and shared types"
```

---

## Task 2: Prisma Schema & Database Setup

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Init Prisma**

```bash
cd apps/api
npx prisma init
```

- [ ] **Step 2: Tulis schema lengkap**

```prisma
// apps/api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum UserRole {
  user
  admin
}

enum PostType {
  review
  photo
  video
  discussion
}

enum GadgetCategory {
  smartphone
  laptop
  tablet
  wearable
  audio
  other
}

enum CompareStatus {
  pending
  processing
  done
  failed
}

model User {
  id          String   @id @default(uuid())
  username    String   @unique @db.VarChar(30)
  displayName String   @db.VarChar(60)
  email       String   @unique @db.VarChar(255)
  passwordHash String?
  avatarUrl   String?
  bio         String?
  trustScore  Float    @default(0)
  role        UserRole @default(user)
  fcmToken    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts         Post[]
  likes         Like[]
  comments      Comment[]
  followers     Follow[]   @relation("Following")
  following     Follow[]   @relation("Follower")
  communities   CommunityMember[]
  comparisons   AiComparison[]
  invitesCreated Invite[]  @relation("InviteCreator")
  inviteUsed    Invite?    @relation("InviteUser")
  ownedGadgets  UserGadget[]

  @@index([email])
  @@index([username])
}

model Gadget {
  id          String         @id @default(uuid())
  name        String         @db.VarChar(100)
  brand       String         @db.VarChar(50)
  category    GadgetCategory
  specs       Json           @default("{}")
  avgScore    Float          @default(0)
  imageUrl    String?
  reviewCount Int            @default(0)
  createdAt   DateTime       @default(now())

  posts       Post[]
  communities Community[]
  userGadgets UserGadget[]

  @@index([brand])
  @@index([category])
}

model UserGadget {
  userId    String
  gadgetId  String
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  gadget    Gadget @relation(fields: [gadgetId], references: [id], onDelete: Cascade)

  @@id([userId, gadgetId])
}

model Post {
  id           String   @id @default(uuid())
  userId       String
  gadgetId     String?
  content      String
  type         PostType
  rating       Int?
  mediaUrls    String[] @default([])
  likeCount    Int      @default(0)
  commentCount Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  gadget   Gadget?   @relation(fields: [gadgetId], references: [id])
  likes    Like[]
  comments Comment[]

  @@index([userId])
  @@index([gadgetId])
  @@index([createdAt(sort: Desc)])
}

model Like {
  userId    String
  postId    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([userId, postId])
}

model Comment {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  content   String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
}

model Community {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(100)
  slug        String   @unique @db.VarChar(100)
  description String?
  gadgetId    String?
  memberCount Int      @default(0)
  createdAt   DateTime @default(now())

  gadget  Gadget?          @relation(fields: [gadgetId], references: [id])
  members CommunityMember[]
}

model CommunityMember {
  userId      String
  communityId String
  joinedAt    DateTime @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  community Community @relation(fields: [communityId], references: [id], onDelete: Cascade)

  @@id([userId, communityId])
}

model Invite {
  id        String    @id @default(uuid())
  code      String    @unique @db.VarChar(20)
  createdById String
  usedById  String?   @unique
  usedAt    DateTime?
  expiresAt DateTime
  createdAt DateTime  @default(now())

  createdBy User  @relation("InviteCreator", fields: [createdById], references: [id])
  usedBy    User? @relation("InviteUser", fields: [usedById], references: [id])

  @@index([code])
}

model AiComparison {
  id             String        @id @default(uuid())
  userId         String
  gadgetIds      String[]
  scores         Json          @default("{}")
  summary        String?
  recommendation String?
  userBudget     Int?
  userUsecase    String?
  status         CompareStatus @default(pending)
  createdAt      DateTime      @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}
```

- [ ] **Step 3: Push schema ke Supabase**

```bash
# Copy .env.example ke .env dan isi semua value dari Supabase dashboard
cp .env.example .env

npx prisma db push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Buat seed data gadget**

```typescript
// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const gadgets = [
    {
      name: 'iPhone 15 Pro',
      brand: 'Apple',
      category: 'smartphone' as const,
      specs: {
        camera: '48MP Main, 12MP Ultra-wide, 12MP 3x Telephoto',
        battery: '3274 mAh, USB-C 27W',
        processor: 'Apple A17 Pro',
        display: '6.1" Super Retina XDR, 120Hz ProMotion',
        ram: '8GB',
        storage: '128GB / 256GB / 512GB / 1TB',
        os: 'iOS 17',
        price: 19999000,
      },
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      category: 'smartphone' as const,
      specs: {
        camera: '200MP Main, 12MP Ultra-wide, 10MP 3x, 50MP 5x',
        battery: '5000 mAh, 45W fast charging',
        processor: 'Snapdragon 8 Gen 3',
        display: '6.8" Dynamic AMOLED 2X, 120Hz',
        ram: '12GB',
        storage: '256GB / 512GB / 1TB',
        os: 'Android 14',
        price: 21999000,
      },
      imageUrl: 'https://images.unsplash.com/photo-1707195580797-1e72a2b0afde?w=400',
    },
    {
      name: 'Google Pixel 8 Pro',
      brand: 'Google',
      category: 'smartphone' as const,
      specs: {
        camera: '50MP Main, 48MP Ultra-wide, 48MP 5x Telephoto',
        battery: '5050 mAh, 30W wired',
        processor: 'Google Tensor G3',
        display: '6.7" LTPO OLED, 120Hz',
        ram: '12GB',
        storage: '128GB / 256GB / 1TB',
        os: 'Android 14',
        price: 14999000,
      },
      imageUrl: 'https://images.unsplash.com/photo-1696426132316-9dc29fcd2f80?w=400',
    },
    {
      name: 'POCO F6',
      brand: 'Xiaomi',
      category: 'smartphone' as const,
      specs: {
        camera: '50MP Main, 8MP Ultra-wide',
        battery: '5000 mAh, 90W fast charging',
        processor: 'Snapdragon 8s Gen 3',
        display: '6.67" AMOLED, 120Hz',
        ram: '12GB',
        storage: '256GB / 512GB',
        os: 'Android 14',
        price: 6999000,
      },
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    },
    {
      name: 'Nothing Phone (2a)',
      brand: 'Nothing',
      category: 'smartphone' as const,
      specs: {
        camera: '50MP Main, 50MP Ultra-wide',
        battery: '5000 mAh, 45W fast charging',
        processor: 'MediaTek Dimensity 7200 Pro',
        display: '6.7" AMOLED, 120Hz',
        ram: '8GB / 12GB',
        storage: '128GB / 256GB',
        os: 'Android 14',
        price: 5999000,
      },
      imageUrl: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400',
    },
  ];

  for (const gadget of gadgets) {
    await prisma.gadget.upsert({
      where: { id: gadget.name.toLowerCase().replace(/ /g, '-') },
      update: {},
      create: gadget,
    });
  }

  // Buat komunitas awal
  const communities = [
    { name: 'iPhone Community', slug: 'iphone', description: 'Komunitas pengguna iPhone Indonesia' },
    { name: 'Android Enthusiast', slug: 'android', description: 'Diskusi semua hal tentang Android' },
    { name: 'Unboxing & Review', slug: 'unboxing', description: 'Share unboxing dan first impressions' },
    { name: 'Budget Gadget', slug: 'budget', description: 'Gadget terbaik di kelasnya' },
  ];

  for (const community of communities) {
    await prisma.community.upsert({
      where: { slug: community.slug },
      update: {},
      create: community,
    });
  }

  console.log('✅ Seed complete: 5 gadgets, 4 communities');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 5: Tambah seed script & jalankan**

```json
// apps/api/package.json — tambahkan ke scripts:
"prisma:seed": "ts-node prisma/seed.ts",
"prisma:studio": "prisma studio"
```

```bash
pnpm prisma:seed
```

Expected: `✅ Seed complete: 5 gadgets, 4 communities`

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/
git commit -m "feat: prisma schema with all tables + gadget seed data"
```

---

## Task 3: NestJS Bootstrap — App Module & Prisma Service

**Files:**
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Buat Prisma Service**

```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

```typescript
// apps/api/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 2: Setup App Module**

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    PrismaModule,
    // Module lain ditambahkan di task berikutnya
  ],
})
export class AppModule {}
```

- [ ] **Step 3: Setup main.ts**

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  app.enableCors({
    origin: [
      'http://localhost:3000', // web dev
      process.env.WEB_URL,
    ].filter(Boolean),
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 DEKAT API running on http://localhost:${port}/api/v1`);
}
bootstrap();
```

- [ ] **Step 4: Jalankan dan verify server berjalan**

```bash
cd apps/api
pnpm start:dev
```

Expected: `🚀 DEKAT API running on http://localhost:3001/api/v1`

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/
git commit -m "feat: nestjs bootstrap with prisma service and app module"
```

---

## Task 4: Auth Module

**Files:**
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.service.ts`
- Create: `apps/api/src/auth/guards/jwt.guard.ts`
- Create: `apps/api/src/auth/guards/roles.guard.ts`
- Create: `apps/api/src/auth/decorators/current-user.decorator.ts`
- Create: `apps/api/src/auth/dto/register.dto.ts`
- Create: `apps/api/src/auth/dto/login.dto.ts`
- Create: `apps/api/src/users/users.service.ts`
- Test: `apps/api/src/auth/auth.service.spec.ts`

- [ ] **Step 1: Tulis failing test untuk auth service**

```typescript
// apps/api/src/auth/auth.service.spec.ts
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });
      await expect(
        service.register({ email: 'test@test.com', password: 'pass123', username: 'test', displayName: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should return accessToken on successful register', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-id', email: 'test@test.com', role: 'user', username: 'test', displayName: 'Test',
      });
      const result = await service.register({
        email: 'test@test.com', password: 'pass123', username: 'test', displayName: 'Test',
      });
      expect(result.accessToken).toBe('mock-token');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@x.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

- [ ] **Step 2: Jalankan test — pastikan FAIL**

```bash
pnpm test auth.service.spec.ts
```

Expected: FAIL — `AuthService` not found

- [ ] **Step 3: Buat DTOs**

```typescript
// apps/api/src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, { message: 'Username hanya boleh huruf kecil, angka, dan underscore' })
  username: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  displayName: string;
}
```

```typescript
// apps/api/src/auth/dto/login.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

- [ ] **Step 4: Buat Auth Service**

```typescript
// apps/api/src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '@dekat/types';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email sudah terdaftar');

    const usernameExists = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (usernameExists) throw new ConflictException('Username sudah dipakai');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName,
        passwordHash,
      },
    });

    return this.signTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Email atau password salah');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Email atau password salah');

    return this.signTokens(user);
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, displayName: true,
        email: true, avatarUrl: true, bio: true,
        trustScore: true, role: true, createdAt: true,
      },
    });
  }

  private signTokens(user: { id: string; email: string; role: string }) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role as any };
    return { accessToken: this.jwt.sign(payload) };
  }
}
```

- [ ] **Step 5: Buat Guards dan Decorator**

```typescript
// apps/api/src/auth/guards/jwt.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
```

```typescript
// apps/api/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.get<string>('role', context.getHandler());
    if (!requiredRole) return true;
    const { user } = context.switchToHttp().getRequest();
    return user?.role === requiredRole;
  }
}
```

```typescript
// apps/api/src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);
```

- [ ] **Step 6: Buat Auth Controller**

```typescript
// apps/api/src/auth/auth.controller.ts
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtPayload } from '@dekat/types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }
}
```

- [ ] **Step 7: Buat Auth Module**

```typescript
// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// JWT Strategy inline
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '@dekat/types';

@Injectable()
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });
  }
  validate(payload: JwtPayload) { return payload; }
}

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
```

- [ ] **Step 8: Daftarkan AuthModule ke AppModule**

```typescript
// apps/api/src/app.module.ts — tambahkan AuthModule
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({ redis: process.env.REDIS_URL }),
    PrismaModule,
    AuthModule, // ← tambahkan
  ],
})
export class AppModule {}
```

- [ ] **Step 9: Jalankan test — pastikan PASS**

```bash
pnpm test auth.service.spec.ts
```

Expected: PASS — 3 tests passed

- [ ] **Step 10: Test manual dengan curl**

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@dekat.id","password":"password123","username":"testuser","displayName":"Test User"}'

# Expected: {"accessToken":"eyJ..."}
```

- [ ] **Step 11: Commit**

```bash
git add apps/api/src/auth/
git commit -m "feat: auth module with register, login, JWT guard"
```

---

## Task 5: Gadgets Module

**Files:**
- Create: `apps/api/src/gadgets/gadgets.module.ts`
- Create: `apps/api/src/gadgets/gadgets.controller.ts`
- Create: `apps/api/src/gadgets/gadgets.service.ts`
- Test: `apps/api/src/gadgets/gadgets.service.spec.ts`

- [ ] **Step 1: Buat failing test**

```typescript
// apps/api/src/gadgets/gadgets.service.spec.ts
import { Test } from '@nestjs/testing';
import { GadgetsService } from './gadgets.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  gadget: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('GadgetsService', () => {
  let service: GadgetsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GadgetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(GadgetsService);
    jest.clearAllMocks();
  });

  it('findAll should return array of gadgets', async () => {
    const gadgets = [{ id: '1', name: 'iPhone 15 Pro', brand: 'Apple' }];
    mockPrisma.gadget.findMany.mockResolvedValue(gadgets);
    const result = await service.findAll({ search: '', category: undefined });
    expect(result).toEqual(gadgets);
    expect(mockPrisma.gadget.findMany).toHaveBeenCalledTimes(1);
  });

  it('findOne should return null for unknown id', async () => {
    mockPrisma.gadget.findUnique.mockResolvedValue(null);
    const result = await service.findOne('unknown-id');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan — pastikan FAIL**

```bash
pnpm test gadgets.service.spec.ts
```

Expected: FAIL — `GadgetsService` not found

- [ ] **Step 3: Implementasi Gadgets Service**

```typescript
// apps/api/src/gadgets/gadgets.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GadgetCategory } from '@prisma/client';

interface FindAllOptions {
  search: string;
  category?: GadgetCategory;
}

@Injectable()
export class GadgetsService {
  constructor(private prisma: PrismaService) {}

  findAll({ search, category }: FindAllOptions) {
    return this.prisma.gadget.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(category && { category }),
      },
      orderBy: { reviewCount: 'desc' },
      take: 50,
    });
  }

  findOne(id: string) {
    return this.prisma.gadget.findUnique({
      where: { id },
      include: {
        _count: { select: { posts: true } },
      },
    });
  }
}
```

- [ ] **Step 4: Buat Controller & Module**

```typescript
// apps/api/src/gadgets/gadgets.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GadgetsService } from './gadgets.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { GadgetCategory } from '@prisma/client';

@Controller('gadgets')
@UseGuards(JwtGuard)
export class GadgetsController {
  constructor(private gadgetsService: GadgetsService) {}

  @Get()
  findAll(@Query('search') search = '', @Query('category') category?: GadgetCategory) {
    return this.gadgetsService.findAll({ search, category });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gadgetsService.findOne(id);
  }
}
```

```typescript
// apps/api/src/gadgets/gadgets.module.ts
import { Module } from '@nestjs/common';
import { GadgetsController } from './gadgets.controller';
import { GadgetsService } from './gadgets.service';

@Module({
  controllers: [GadgetsController],
  providers: [GadgetsService],
  exports: [GadgetsService],
})
export class GadgetsModule {}
```

- [ ] **Step 5: Daftarkan ke AppModule, jalankan test**

```typescript
// apps/api/src/app.module.ts — tambahkan GadgetsModule
import { GadgetsModule } from './gadgets/gadgets.module';
// ... tambahkan GadgetsModule ke imports array
```

```bash
pnpm test gadgets.service.spec.ts
```

Expected: PASS — 2 tests passed

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/gadgets/
git commit -m "feat: gadgets module with search and category filter"
```

---

## Task 6: Posts Module (CRUD + Like + Comment)

**Files:**
- Create: `apps/api/src/posts/posts.module.ts`
- Create: `apps/api/src/posts/posts.controller.ts`
- Create: `apps/api/src/posts/posts.service.ts`
- Create: `apps/api/src/posts/dto/create-post.dto.ts`
- Test: `apps/api/src/posts/posts.service.spec.ts`

- [ ] **Step 1: Buat failing test**

```typescript
// apps/api/src/posts/posts.service.spec.ts
import { Test } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  post: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  like: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  comment: { create: jest.fn() },
  $transaction: jest.fn(),
};

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(PostsService);
    jest.clearAllMocks();
  });

  it('create should save post with correct userId', async () => {
    const post = { id: '1', userId: 'user-1', content: 'Great phone!', type: 'review' };
    mockPrisma.post.create.mockResolvedValue(post);
    const result = await service.create('user-1', {
      content: 'Great phone!', type: 'review' as any, mediaUrls: [],
    });
    expect(result.userId).toBe('user-1');
    expect(mockPrisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }),
    );
  });

  it('toggleLike should create like if not exists', async () => {
    mockPrisma.like.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
    mockPrisma.like.create.mockResolvedValue({});
    mockPrisma.post.update.mockResolvedValue({});

    await service.toggleLike('user-1', 'post-1');
    expect(mockPrisma.like.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', postId: 'post-1' },
    });
  });
});
```

- [ ] **Step 2: Jalankan — pastikan FAIL**

```bash
pnpm test posts.service.spec.ts
```

Expected: FAIL

- [ ] **Step 3: Buat DTO**

```typescript
// apps/api/src/posts/dto/create-post.dto.ts
import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsArray, IsUUID } from 'class-validator';
import { PostType } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  content: string;

  @IsEnum(PostType)
  type: PostType;

  @IsOptional()
  @IsUUID()
  gadgetId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}
```

- [ ] **Step 4: Implementasi Posts Service**

```typescript
// apps/api/src/posts/posts.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        userId,
        content: dto.content,
        type: dto.type,
        gadgetId: dto.gadgetId,
        rating: dto.rating,
        mediaUrls: dto.mediaUrls ?? [],
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true } },
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
      },
    });
  }

  async findFeed(userId: string, cursor?: string) {
    // Phase 1: reverse-chronological dari following + semua post
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    return this.prisma.post.findMany({
      where: {
        OR: [
          { userId: { in: followingIds } },
          { userId }, // post sendiri juga muncul
        ],
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true } },
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true } },
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
        comments: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
        _count: { select: { likes: true } },
      },
    });
    if (!post) throw new NotFoundException('Post tidak ditemukan');
    return post;
  }

  async delete(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post tidak ditemukan');
    if (post.userId !== userId) throw new ForbiddenException('Bukan post kamu');
    return this.prisma.post.delete({ where: { id: postId } });
  }

  async toggleLike(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.like.delete({ where: { userId_postId: { userId, postId } } });
        await tx.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
      } else {
        await tx.like.create({ data: { userId, postId } });
        await tx.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
      }
    });

    return { liked: !existing };
  }

  async addComment(userId: string, postId: string, content: string) {
    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: { userId, postId, content },
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      }),
      this.prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
    ]);
    return comment;
  }
}
```

- [ ] **Step 5: Buat Controller**

```typescript
// apps/api/src/posts/posts.controller.ts
import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@dekat/types';

@Controller('posts')
@UseGuards(JwtGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePostDto) {
    return this.postsService.create(user.sub, dto);
  }

  @Get('feed')
  getFeed(@CurrentUser() user: JwtPayload, @Query('cursor') cursor?: string) {
    return this.postsService.findFeed(user.sub, cursor);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.postsService.delete(user.sub, id);
  }

  @Post(':id/like')
  toggleLike(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.postsService.toggleLike(user.sub, id);
  }

  @Post(':id/comment')
  addComment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.postsService.addComment(user.sub, id, content);
  }
}
```

```typescript
// apps/api/src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
```

- [ ] **Step 6: Jalankan test — PASS**

```bash
pnpm test posts.service.spec.ts
```

Expected: PASS — 2 tests passed

- [ ] **Step 7: Daftarkan ke AppModule & commit**

```typescript
// app.module.ts — tambahkan PostsModule
import { PostsModule } from './posts/posts.module';
```

```bash
git add apps/api/src/posts/
git commit -m "feat: posts module with feed, like toggle, and comments"
```

---

## Task 7: Media Upload (Supabase Storage)

**Files:**
- Create: `apps/api/src/media/media.module.ts`
- Create: `apps/api/src/media/media.controller.ts`
- Create: `apps/api/src/media/media.service.ts`
- Test: `apps/api/src/media/media.service.spec.ts`

- [ ] **Step 1: Buat failing test**

```typescript
// apps/api/src/media/media.service.spec.ts
import { Test } from '@nestjs/testing';
import { MediaService } from './media.service';
import { ConfigService } from '@nestjs/config';

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_KEY: 'test-key',
      SUPABASE_STORAGE_BUCKET: 'dekat-media',
    };
    return map[key];
  }),
};

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generateFilePath should return path with userId prefix', () => {
    const path = service.generateFilePath('user-123', 'image.jpg');
    expect(path).toMatch(/^user-123\//);
    expect(path).toMatch(/\.jpg$/);
  });
});
```

- [ ] **Step 2: Implementasi Media Service**

```typescript
// apps/api/src/media/media.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

@Injectable()
export class MediaService {
  private supabase;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.supabase = createClient(
      config.get('SUPABASE_URL'),
      config.get('SUPABASE_SERVICE_KEY'),
    );
    this.bucket = config.get('SUPABASE_STORAGE_BUCKET');
  }

  generateFilePath(userId: string, originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase() ?? 'bin';
    return `${userId}/${nanoid(16)}.${ext}`;
  }

  async upload(userId: string, file: Express.Multer.File): Promise<string> {
    const path = this.generateFilePath(userId, file.originalname);

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new Error(`Upload gagal: ${error.message}`);

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteByUrl(publicUrl: string): Promise<void> {
    const bucketPath = publicUrl.split(`/${this.bucket}/`)[1];
    if (!bucketPath) return;
    await this.supabase.storage.from(this.bucket).remove([bucketPath]);
  }
}
```

- [ ] **Step 3: Buat Controller dengan multer**

```typescript
// apps/api/src/media/media.controller.ts
import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@dekat/types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

@Controller('media')
@UseGuards(JwtGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('File type tidak didukung. Gunakan JPG, PNG, WebP, atau MP4'), false);
      },
    }),
  )
  async upload(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File tidak ditemukan');
    const url = await this.mediaService.upload(user.sub, file);
    return { url };
  }
}
```

```typescript
// apps/api/src/media/media.module.ts
import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
```

- [ ] **Step 4: Install multer types & jalankan test**

```bash
pnpm add -D @types/multer
pnpm add @nestjs/platform-express multer
pnpm test media.service.spec.ts
```

Expected: PASS — 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/media/
git commit -m "feat: media upload to supabase storage with type validation"
```

---

## Task 8: Social Module — Follow & Feed

**Files:**
- Create: `apps/api/src/social/social.module.ts`
- Create: `apps/api/src/social/social.controller.ts`
- Create: `apps/api/src/social/social.service.ts`
- Test: `apps/api/src/social/social.service.spec.ts`

- [ ] **Step 1: Buat failing test**

```typescript
// apps/api/src/social/social.service.spec.ts
import { Test } from '@nestjs/testing';
import { SocialService } from './social.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  follow: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  user: { findUnique: jest.fn() },
  $transaction: jest.fn(),
};

describe('SocialService', () => {
  let service: SocialService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(SocialService);
    jest.clearAllMocks();
  });

  it('follow should throw if user tries to follow themselves', async () => {
    await expect(service.toggleFollow('user-1', 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('follow should create follow if not exists', async () => {
    mockPrisma.follow.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
    mockPrisma.follow.create.mockResolvedValue({});
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-2' });

    await service.toggleFollow('user-1', 'user-2');
    expect(mockPrisma.follow.create).toHaveBeenCalledWith({
      data: { followerId: 'user-1', followingId: 'user-2' },
    });
  });
});
```

- [ ] **Step 2: Implementasi Social Service**

```typescript
// apps/api/src/social/social.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new BadRequestException('Tidak bisa follow diri sendiri');

    const target = await this.prisma.user.findUnique({ where: { id: followingId } });
    if (!target) throw new NotFoundException('User tidak ditemukan');

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.follow.delete({ where: { followerId_followingId: { followerId, followingId } } });
      } else {
        await tx.follow.create({ data: { followerId, followingId } });
      }
    });

    return { following: !existing };
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return user;
  }

  async getProfile(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, displayName: true, avatarUrl: true,
        bio: true, trustScore: true, createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    let isFollowing = false;
    if (viewerId) {
      const follow = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
      });
      isFollowing = !!follow;
    }

    return { ...user, isFollowing };
  }

  async getTrending(limit = 10) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 jam terakhir
    return this.prisma.post.findMany({
      where: { createdAt: { gte: since } },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        gadget: { select: { id: true, name: true, brand: true } },
      },
      orderBy: { likeCount: 'desc' },
      take: limit,
    });
  }
}
```

- [ ] **Step 3: Buat Controller & Module**

```typescript
// apps/api/src/social/social.controller.ts
import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@dekat/types';

@Controller()
@UseGuards(JwtGuard)
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Post('users/:username/follow')
  async toggleFollow(@CurrentUser() user: JwtPayload, @Param('username') username: string) {
    const target = await this.socialService.findByUsername(username);
    return this.socialService.toggleFollow(user.sub, target.id);
  }

  @Get('users/:username')
  getProfile(@Param('username') username: string, @CurrentUser() user: JwtPayload) {
    return this.socialService.getProfile(username, user.sub);
  }

  @Get('feed/trending')
  getTrending(@Query('limit') limit = '10') {
    return this.socialService.getTrending(parseInt(limit));
  }
}
```

```typescript
// apps/api/src/social/social.module.ts
import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
```

- [ ] **Step 4: Jalankan test — PASS**

```bash
pnpm test social.service.spec.ts
```

Expected: PASS — 2 tests passed

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/social/
git commit -m "feat: social module with follow/unfollow, profile, trending feed"
```

---

## Task 9: Communities Module

**Files:**
- Create: `apps/api/src/communities/communities.module.ts`
- Create: `apps/api/src/communities/communities.controller.ts`
- Create: `apps/api/src/communities/communities.service.ts`
- Test: `apps/api/src/communities/communities.service.spec.ts`

- [ ] **Step 1: Buat failing test**

```typescript
// apps/api/src/communities/communities.service.spec.ts
import { Test } from '@nestjs/testing';
import { CommunitiesService } from './communities.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  community: { findMany: jest.fn(), findUnique: jest.fn() },
  communityMember: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn() },
  $transaction: jest.fn(),
};

describe('CommunitiesService', () => {
  let service: CommunitiesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CommunitiesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(CommunitiesService);
    jest.clearAllMocks();
  });

  it('findAll should return communities list', async () => {
    const communities = [{ id: '1', name: 'iPhone Community', slug: 'iphone', memberCount: 10 }];
    mockPrisma.community.findMany.mockResolvedValue(communities);
    const result = await service.findAll();
    expect(result).toEqual(communities);
  });

  it('toggleMember should create membership if not exists', async () => {
    mockPrisma.communityMember.findUnique.mockResolvedValue(null);
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
    mockPrisma.communityMember.create.mockResolvedValue({});
    mockPrisma.community.findUnique.mockResolvedValue({ id: 'c-1' });

    await service.toggleMember('user-1', 'c-1');
    expect(mockPrisma.communityMember.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', communityId: 'c-1' },
    });
  });
});
```

- [ ] **Step 2: Jalankan — pastikan FAIL**

```bash
pnpm test communities.service.spec.ts
```

- [ ] **Step 3: Implementasi Communities Service**

```typescript
// apps/api/src/communities/communities.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.community.findMany({
      include: {
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
        _count: { select: { members: true } },
      },
      orderBy: { memberCount: 'desc' },
    });
  }

  async findOne(slug: string, userId?: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      include: {
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
        _count: { select: { members: true } },
      },
    });
    if (!community) throw new NotFoundException('Komunitas tidak ditemukan');

    let isMember = false;
    if (userId) {
      const membership = await this.prisma.communityMember.findUnique({
        where: { userId_communityId: { userId, communityId: community.id } },
      });
      isMember = !!membership;
    }

    return { ...community, isMember };
  }

  async toggleMember(userId: string, communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Komunitas tidak ditemukan');

    const existing = await this.prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });

    await this.prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.communityMember.delete({ where: { userId_communityId: { userId, communityId } } });
        await tx.community.update({ where: { id: communityId }, data: { memberCount: { decrement: 1 } } });
      } else {
        await tx.communityMember.create({ data: { userId, communityId } });
        await tx.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } });
      }
    });

    return { joined: !existing };
  }
}
```

- [ ] **Step 4: Buat Controller & Module**

```typescript
// apps/api/src/communities/communities.controller.ts
import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@dekat/types';

@Controller('communities')
@UseGuards(JwtGuard)
export class CommunitiesController {
  constructor(private communitiesService: CommunitiesService) {}

  @Get()
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    return this.communitiesService.findOne(slug, user.sub);
  }

  @Post(':id/join')
  toggleMember(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.communitiesService.toggleMember(user.sub, id);
  }
}
```

```typescript
// apps/api/src/communities/communities.module.ts
import { Module } from '@nestjs/common';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';

@Module({
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
})
export class CommunitiesModule {}
```

- [ ] **Step 5: Jalankan test — PASS**

```bash
pnpm test communities.service.spec.ts
```

Expected: PASS — 2 tests passed

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/communities/
git commit -m "feat: communities module with join/leave toggle"
```

---

## Task 10: Bookmark Feature

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (tambah Bookmark model)
- Modify: `apps/api/src/posts/posts.service.ts`
- Modify: `apps/api/src/posts/posts.controller.ts`
- Test: tambah ke `apps/api/src/posts/posts.service.spec.ts`

- [ ] **Step 1: Tambah Bookmark model ke schema**

```prisma
// apps/api/prisma/schema.prisma — tambahkan model ini
model Bookmark {
  userId    String
  postId    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([userId, postId])
}
```

Tambahkan juga relasi di model `User` dan `Post`:
```prisma
// Di model User — tambahkan:
bookmarks Bookmark[]

// Di model Post — tambahkan:
bookmarks Bookmark[]
```

- [ ] **Step 2: Push perubahan schema**

```bash
npx prisma db push
npx prisma generate
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Tambah test untuk bookmark**

```typescript
// Tambahkan di apps/api/src/posts/posts.service.spec.ts
// Di dalam mockPrisma, tambahkan:
// bookmark: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },

it('toggleBookmark should create bookmark if not exists', async () => {
  mockPrisma.bookmark = {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    delete: jest.fn(),
  };
  // mock $transaction
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
  await service.toggleBookmark('user-1', 'post-1');
  expect(mockPrisma.bookmark.create).toHaveBeenCalledWith({
    data: { userId: 'user-1', postId: 'post-1' },
  });
});
```

- [ ] **Step 4: Tambah toggleBookmark ke Posts Service**

```typescript
// Tambahkan method ini di apps/api/src/posts/posts.service.ts

async toggleBookmark(userId: string, postId: string) {
  const existing = await this.prisma.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existing) {
    await this.prisma.bookmark.delete({ where: { userId_postId: { userId, postId } } });
  } else {
    await this.prisma.bookmark.create({ data: { userId, postId } });
  }

  return { bookmarked: !existing };
}

async getBookmarks(userId: string) {
  return this.prisma.bookmark.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
}
```

- [ ] **Step 5: Tambah endpoint ke Posts Controller**

```typescript
// Tambahkan di apps/api/src/posts/posts.controller.ts

@Post(':id/bookmark')
toggleBookmark(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
  return this.postsService.toggleBookmark(user.sub, id);
}

@Get('bookmarks/me')
getBookmarks(@CurrentUser() user: JwtPayload) {
  return this.postsService.getBookmarks(user.sub);
}
```

- [ ] **Step 6: Jalankan semua test posts**

```bash
pnpm test posts.service.spec.ts
```

Expected: PASS — semua tests passed

- [ ] **Step 7: Commit**

```bash
git add apps/api/prisma/ apps/api/src/posts/
git commit -m "feat: bookmark toggle and get saved posts endpoint"
```

---

## Task 11: Invite System

**Files:**
- Create: `apps/api/src/invites/invites.module.ts`
- Create: `apps/api/src/invites/invites.controller.ts`
- Create: `apps/api/src/invites/invites.service.ts`
- Test: `apps/api/src/invites/invites.service.spec.ts`

- [ ] **Step 1: Buat failing test**

```typescript
// apps/api/src/invites/invites.service.spec.ts
import { Test } from '@nestjs/testing';
import { InvitesService } from './invites.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  invite: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('InvitesService', () => {
  let service: InvitesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvitesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(InvitesService);
    jest.clearAllMocks();
  });

  it('create should generate invite with 7-day expiry', async () => {
    const now = Date.now();
    mockPrisma.invite.create.mockResolvedValue({ id: '1', code: 'DEKAT-ABCD12', expiresAt: new Date(now + 7 * 86400000) });
    const invite = await service.create('user-1');
    const expiryDiff = invite.expiresAt.getTime() - now;
    expect(expiryDiff).toBeGreaterThan(6 * 86400000); // > 6 hari
    expect(invite.code).toMatch(/^DEKAT-/);
  });

  it('redeem should throw if code expired', async () => {
    mockPrisma.invite.findUnique.mockResolvedValue({
      id: '1',
      code: 'DEKAT-ABCD12',
      usedById: null,
      expiresAt: new Date(Date.now() - 1000), // sudah expired
    });
    await expect(service.redeem('DEKAT-ABCD12', 'user-2')).rejects.toThrow(BadRequestException);
  });
});
```

- [ ] **Step 2: Implementasi Invites Service**

```typescript
// apps/api/src/invites/invites.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

  async create(createdById: string) {
    const code = `DEKAT-${nanoid(8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari

    return this.prisma.invite.create({
      data: { code, createdById, expiresAt },
    });
  }

  async redeem(code: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { code } });
    if (!invite) throw new NotFoundException('Kode invite tidak valid');
    if (invite.usedById) throw new BadRequestException('Kode invite sudah dipakai');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Kode invite sudah expired');
    if (invite.createdById === userId) throw new BadRequestException('Tidak bisa pakai invite kamu sendiri');

    return this.prisma.invite.update({
      where: { id: invite.id },
      data: { usedById: userId, usedAt: new Date() },
    });
  }

  findByUser(createdById: string) {
    return this.prisma.invite.findMany({
      where: { createdById },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

```typescript
// apps/api/src/invites/invites.controller.ts
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@dekat/types';

@Controller('invites')
@UseGuards(JwtGuard)
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  @Post('generate')
  create(@CurrentUser() user: JwtPayload) {
    return this.invitesService.create(user.sub);
  }

  @Post('redeem')
  redeem(@CurrentUser() user: JwtPayload, @Body('code') code: string) {
    return this.invitesService.redeem(code, user.sub);
  }

  @Get('mine')
  getMine(@CurrentUser() user: JwtPayload) {
    return this.invitesService.findByUser(user.sub);
  }
}
```

```typescript
// apps/api/src/invites/invites.module.ts
import { Module } from '@nestjs/common';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
```

- [ ] **Step 3: Jalankan test — PASS**

```bash
pnpm test invites.service.spec.ts
```

Expected: PASS — 2 tests passed

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/invites/
git commit -m "feat: invite system with 7-day expiry and redeem flow"
```

---

## Task 12: AI Compare Module

**Files:**
- Create: `apps/api/src/ai/ai.module.ts`
- Create: `apps/api/src/ai/ai.controller.ts`
- Create: `apps/api/src/ai/ai.service.ts`
- Create: `apps/api/src/ai/ai.processor.ts`
- Create: `apps/api/src/ai/dto/compare-request.dto.ts`
- Test: `apps/api/src/ai/ai.service.spec.ts`

- [ ] **Step 1: Buat failing test**

```typescript
// apps/api/src/ai/ai.service.spec.ts
import { Test } from '@nestjs/testing';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bull';

const mockPrisma = {
  aiComparison: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  gadget: { findMany: jest.fn() },
  post: { findMany: jest.fn() },
};

const mockQueue = { add: jest.fn() };

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken('ai-compare'), useValue: mockQueue },
      ],
    }).compile();
    service = module.get(AiService);
    jest.clearAllMocks();
  });

  it('createComparison should enqueue job and return pending comparison', async () => {
    const comparison = { id: 'cmp-1', status: 'pending', gadgetIds: ['g1', 'g2'] };
    mockPrisma.aiComparison.create.mockResolvedValue(comparison);

    const result = await service.createComparison('user-1', {
      gadgetIds: ['g1', 'g2'], userBudget: 10000000, userUsecase: 'photography',
    });

    expect(result.status).toBe('pending');
    expect(mockQueue.add).toHaveBeenCalledWith(
      'process-comparison',
      { comparisonId: 'cmp-1' },
      expect.any(Object),
    );
  });
});
```

- [ ] **Step 2: Buat DTO**

```typescript
// apps/api/src/ai/dto/compare-request.dto.ts
import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize, IsOptional, IsInt, IsString } from 'class-validator';

export class CompareRequestDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(3)
  gadgetIds: string[];

  @IsOptional()
  @IsInt()
  userBudget?: number;

  @IsOptional()
  @IsString()
  userUsecase?: string;
}
```

- [ ] **Step 3: Implementasi AI Service**

```typescript
// apps/api/src/ai/ai.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CompareRequestDto } from './dto/compare-request.dto';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('ai-compare') private compareQueue: Queue,
  ) {}

  async createComparison(userId: string, dto: CompareRequestDto) {
    const comparison = await this.prisma.aiComparison.create({
      data: {
        userId,
        gadgetIds: dto.gadgetIds,
        userBudget: dto.userBudget,
        userUsecase: dto.userUsecase,
        status: 'pending',
      },
    });

    await this.compareQueue.add(
      'process-comparison',
      { comparisonId: comparison.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    );

    return comparison;
  }

  async getComparison(id: string, userId: string) {
    const comparison = await this.prisma.aiComparison.findUnique({ where: { id } });
    if (!comparison) throw new NotFoundException('Comparison tidak ditemukan');
    if (comparison.userId !== userId) throw new NotFoundException('Comparison tidak ditemukan');
    return comparison;
  }

  async getGadgetSentiment(gadgetId: string) {
    const reviews = await this.prisma.post.findMany({
      where: { gadgetId, type: { in: ['review'] } },
      select: { content: true, rating: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (reviews.length === 0) {
      return { gadgetId, reviewCount: 0, avgRating: null, sentiment: null };
    }

    const avgRating = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length;
    return { gadgetId, reviewCount: reviews.length, avgRating: Math.round(avgRating * 10) / 10 };
  }
}
```

- [ ] **Step 4: Implementasi AI Processor (Bull Worker)**

```typescript
// apps/api/src/ai/ai.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { ComparisonScores, GadgetCompareScore } from '@dekat/types';

@Processor('ai-compare')
export class AiProcessor {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  @Process('process-comparison')
  async handleComparison(job: Job<{ comparisonId: string }>) {
    const { comparisonId } = job.data;

    await this.prisma.aiComparison.update({
      where: { id: comparisonId },
      data: { status: 'processing' },
    });

    try {
      const comparison = await this.prisma.aiComparison.findUnique({ where: { id: comparisonId } });
      if (!comparison) throw new Error('Comparison not found');

      const gadgets = await this.prisma.gadget.findMany({
        where: { id: { in: comparison.gadgetIds } },
      });

      // Ambil review komunitas untuk setiap gadget
      const reviewsPerGadget: Record<string, string[]> = {};
      for (const gadget of gadgets) {
        const reviews = await this.prisma.post.findMany({
          where: { gadgetId: gadget.id, type: 'review' },
          select: { content: true, rating: true },
          take: 20,
          orderBy: { createdAt: 'desc' },
        });
        reviewsPerGadget[gadget.id] = reviews.map(
          (r) => `[Rating: ${r.rating ?? 'N/A'}] ${r.content}`,
        );
      }

      const gadgetContext = gadgets.map((g) => ({
        id: g.id,
        name: g.name,
        brand: g.brand,
        specs: g.specs,
        communityReviews: reviewsPerGadget[g.id],
      }));

      const prompt = this.buildPrompt(gadgetContext, comparison.userBudget, comparison.userUsecase);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah ahli gadget Indonesia yang membantu user membandingkan device secara objektif. 
Gunakan data spesifikasi dan review komunitas yang diberikan.
Selalu jawab dalam Bahasa Indonesia yang natural dan mudah dipahami.
Output HARUS berupa JSON valid sesuai schema yang diminta.`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content ?? '{}');

      await this.prisma.aiComparison.update({
        where: { id: comparisonId },
        data: {
          scores: result.scores as any,
          summary: result.summary,
          recommendation: result.recommendation,
          status: 'done',
        },
      });
    } catch (error) {
      await this.prisma.aiComparison.update({
        where: { id: comparisonId },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  private buildPrompt(
    gadgets: Array<{ id: string; name: string; brand: string; specs: any; communityReviews: string[] }>,
    budget?: number | null,
    usecase?: string | null,
  ): string {
    const gadgetList = gadgets.map((g) => `
Device: ${g.name} (${g.brand})
ID: ${g.id}
Spesifikasi: ${JSON.stringify(g.specs, null, 2)}
Review Komunitas DEKAT (${g.communityReviews.length} review):
${g.communityReviews.slice(0, 10).join('\n') || 'Belum ada review'}
`).join('\n---\n');

    return `Bandingkan device-device berikut:

${gadgetList}

${budget ? `Budget user: Rp ${budget.toLocaleString('id-ID')}` : ''}
${usecase ? `Kebutuhan utama: ${usecase}` : ''}

Berikan analisis dalam format JSON berikut:
{
  "scores": {
    "<gadget_id>": {
      "overall": <0-10>,
      "camera": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "battery": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "performance": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "display": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "ecosystem": { "score": <0-10>, "justification": "<alasan 1-2 kalimat>" },
      "sentimentScore": <0-10 dari review komunitas>,
      "topComplaints": ["<keluhan 1>", "<keluhan 2>", "<keluhan 3>"],
      "topPraises": ["<pujian 1>", "<pujian 2>", "<pujian 3>"]
    }
  },
  "summary": "<ringkasan perbandingan 2-3 kalimat>",
  "recommendation": "<rekomendasi spesifik berdasarkan kebutuhan user, sebutkan nama device>"
}`;
  }
}
```

- [ ] **Step 5: Buat Controller & Module**

```typescript
// apps/api/src/ai/ai.controller.ts
import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { CompareRequestDto } from './dto/compare-request.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '@dekat/types';

@Controller('ai')
@UseGuards(JwtGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('compare')
  createComparison(@CurrentUser() user: JwtPayload, @Body() dto: CompareRequestDto) {
    return this.aiService.createComparison(user.sub, dto);
  }

  @Get('compare/:id')
  getComparison(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.aiService.getComparison(id, user.sub);
  }

  @Get('gadgets/:gadgetId/sentiment')
  getSentiment(@Param('gadgetId') gadgetId: string) {
    return this.aiService.getGadgetSentiment(gadgetId);
  }
}
```

```typescript
// apps/api/src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiProcessor } from './ai.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'ai-compare' }),
  ],
  controllers: [AiController],
  providers: [AiService, AiProcessor],
})
export class AiModule {}
```

- [ ] **Step 6: Jalankan test — PASS**

```bash
pnpm test ai.service.spec.ts
```

Expected: PASS — 1 test passed

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/ai/
git commit -m "feat: AI compare module with GPT-4o, bull queue, and community sentiment"
```

---

## Task 13: WebSocket Gateway & Push Notifications

**Files:**
- Create: `apps/api/src/gateway/events.gateway.ts`
- Create: `apps/api/src/notifications/notifications.module.ts`
- Create: `apps/api/src/notifications/notifications.service.ts`

- [ ] **Step 1: Buat WebSocket Gateway**

```typescript
// apps/api/src/gateway/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId → socketId

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token as string;
      const payload = this.jwt.verify(token);
      this.userSockets.set(payload.sub, client.id);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.userSockets.delete(client.data.userId);
    }
  }

  // Kirim notif ke user spesifik
  notifyUser(userId: string, event: string, data: unknown) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Broadcast AI Compare selesai
  notifyCompareReady(userId: string, comparisonId: string) {
    this.notifyUser(userId, 'compare:ready', { comparisonId });
  }
}
```

- [ ] **Step 2: Buat Notifications Service (FCM)**

```typescript
// apps/api/src/notifications/notifications.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
  }

  async sendPush(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    if (!fcmToken) return;
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
    } catch (error) {
      // Token kadaluarsa — log saja, jangan crash
      console.warn(`FCM send failed for token: ${error.message}`);
    }
  }
}
```

```typescript
// apps/api/src/notifications/notifications.module.ts
import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

- [ ] **Step 3: Daftarkan semua module ke AppModule**

```typescript
// apps/api/src/app.module.ts — versi final
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GadgetsModule } from './gadgets/gadgets.module';
import { PostsModule } from './posts/posts.module';
import { MediaModule } from './media/media.module';
import { SocialModule } from './social/social.module';
import { CommunitiesModule } from './communities/communities.module';
import { InvitesModule } from './invites/invites.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsGateway } from './gateway/events.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({ redis: process.env.REDIS_URL || 'redis://localhost:6379' }),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    GadgetsModule,
    PostsModule,
    MediaModule,
    SocialModule,
    CommunitiesModule,
    InvitesModule,
    AiModule,
  ],
  providers: [EventsGateway],
})
export class AppModule {}
```

- [ ] **Step 4: Jalankan semua test**

```bash
pnpm test
```

Expected: All test suites PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/gateway/ apps/api/src/notifications/ apps/api/src/app.module.ts
git commit -m "feat: websocket gateway for real-time notifs + FCM push notifications"
```

---

## Task 14: Deploy ke Railway

**Files:**
- Create: `apps/api/Dockerfile`
- Create: `apps/api/railway.json`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Buat Dockerfile**

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter api build
RUN pnpm --filter api prisma generate

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

- [ ] **Step 2: Buat railway.json**

```json
// apps/api/railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/api/Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/main.js",
    "healthcheckPath": "/api/v1/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

- [ ] **Step 3: Tambah health check endpoint**

```typescript
// apps/api/src/app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

- [ ] **Step 4: Deploy ke Railway**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login dan buat project
railway login
railway init

# Set environment variables di Railway dashboard:
# DATABASE_URL, DIRECT_URL, JWT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY
# SUPABASE_STORAGE_BUCKET, OPENAI_API_KEY, REDIS_URL
# FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL

# Deploy
railway up
```

Expected: `✅ Deployment successful. URL: https://dekat-api-xxx.railway.app`

- [ ] **Step 5: Verify health endpoint**

```bash
curl https://dekat-api-xxx.railway.app/api/v1/health
```

Expected: `{"status":"ok","timestamp":"2026-05-13T..."}`

- [ ] **Step 6: Jalankan prisma migrate di production**

```bash
railway run npx prisma db push
railway run npx ts-node apps/api/prisma/seed.ts
```

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat: dockerfile and railway deploy config"
git tag v1.0.0-backend
```

---

## Verifikasi Akhir Backend

Setelah semua task selesai, jalankan checklist ini:

```bash
# Run all tests
pnpm test

# Build check
pnpm build:api

# Test semua endpoint manual:
BASE="http://localhost:3001/api/v1"

# 1. Register
curl -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"email":"admin@dekat.id","password":"admin123456","username":"dekatadmin","displayName":"DEKAT Admin"}'

# 2. Login dan simpan token
TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@dekat.id","password":"admin123456"}' | jq -r .accessToken)

# 3. Get profile
curl $BASE/auth/me -H "Authorization: Bearer $TOKEN"

# 4. List gadgets
curl "$BASE/gadgets" -H "Authorization: Bearer $TOKEN"

# 5. Buat post
curl -X POST $BASE/posts -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"iPhone 15 Pro setelah 3 bulan — baterai masih oke!","type":"review","rating":4}'

# 6. Buat invite
curl -X POST $BASE/invites/generate -H "Authorization: Bearer $TOKEN"

# 7. Start AI Compare (ganti GADGET_ID dengan ID dari step 4)
curl -X POST $BASE/ai/compare -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gadgetIds":["GADGET_ID_1","GADGET_ID_2"],"userBudget":15000000,"userUsecase":"fotografi"}'
```

---

## Catatan Penting

- **Communities Module** sudah ada di Task 9 — join/leave toggle dengan `CommunityMember` table.
- **Web Frontend Plan** tersedia di: `docs/superpowers/plans/2026-05-13-dekat-phase1-web.md` (dibuat terpisah)
- **Mobile App Plan** tersedia di: `docs/superpowers/plans/2026-05-13-dekat-phase1-mobile.md` (dibuat terpisah)
- Redis harus berjalan lokal untuk development: `docker run -d -p 6379:6379 redis:alpine`
