import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '@gueposting/types';
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
      data: { email: dto.email, username: dto.username, displayName: dto.displayName, passwordHash, phone: dto.phone },
    });

    return this.signTokens(user);
  }

  async setupAdmin(dto: { email: string; username: string; displayName: string; password: string }) {
    const count = await this.prisma.user.count();
    if (count > 0) throw new ConflictException('Setup sudah dilakukan. Gunakan halaman register biasa.');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, username: dto.username, displayName: dto.displayName, passwordHash, role: 'admin', status: 'active' },
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
      select: { id: true, username: true, displayName: true, email: true, avatarUrl: true, avatarPositionX: true, avatarPositionY: true, coverUrl: true, coverPositionY: true, bio: true, location: true, website: true, trustScore: true, role: true, status: true, currentGadgetId: true, createdAt: true },
    });
  }

  async updateProfile(userId: string, data: { displayName?: string; bio?: string; avatarUrl?: string; avatarPositionX?: number; avatarPositionY?: number; coverUrl?: string | null; coverPositionY?: number; location?: string | null; website?: string | null }) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.avatarPositionX !== undefined && { avatarPositionX: data.avatarPositionX }),
        ...(data.avatarPositionY !== undefined && { avatarPositionY: data.avatarPositionY }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
        ...(data.coverPositionY !== undefined && { coverPositionY: data.coverPositionY }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.website !== undefined && { website: data.website }),
      },
      select: { id: true, username: true, displayName: true, email: true, avatarUrl: true, avatarPositionX: true, avatarPositionY: true, coverUrl: true, coverPositionY: true, bio: true, location: true, website: true, trustScore: true, role: true, status: true, currentGadgetId: true },
    });
    return updated;
  }

  async completeOnboarding(userId: string, gadgetId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { currentGadgetId: gadgetId },
      select: { id: true, username: true, displayName: true, email: true, avatarUrl: true, trustScore: true, role: true, status: true, currentGadgetId: true },
    });
  }

  async findOrCreateGoogleUser(profile: { email: string; displayName: string; avatarUrl?: string }) {
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });

    if (!user) {
      const baseUsername = profile.email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 20) || 'user';
      let username = baseUsername;
      let suffix = 1;
      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${suffix++}`;
      }
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        },
      });
    }

    return this.signTokens(user);
  }

  private async signTokens(user: { id: string; email: string; role: string; status: string; username: string; displayName: string; avatarUrl?: string | null; trustScore?: number }) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role as any };
    const token = this.jwt.sign(payload);
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
        trustScore: user.trustScore ?? 0,
        role: user.role,
        status: user.status,
      },
    };
  }
}
