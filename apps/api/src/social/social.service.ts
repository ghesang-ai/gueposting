import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService, private notifs: NotificationsService) {}

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
        this.notifs.createNotif({ userId: followingId, actorId: followerId, type: 'follow' }).catch(() => {});
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
        id: true, username: true, displayName: true, avatarUrl: true, avatarPositionX: true, avatarPositionY: true,
        coverUrl: true, coverPositionY: true, bio: true, location: true, website: true,
        trustScore: true, createdAt: true,
        _count: { select: { posts: true, followers: true, following: true } },
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

  async getUserPosts(username: string, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return this.prisma.post.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true } },
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getFollowers(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const follows = await this.prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, trustScore: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const followerIds = follows.map((f) => f.follower.id);

    // Check which ones the viewer is already following
    let viewerFollowing = new Set<string>();
    if (viewerId) {
      const vf = await this.prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: followerIds } },
        select: { followingId: true },
      });
      viewerFollowing = new Set(vf.map((f) => f.followingId));
    }

    // Check which followers also follow the viewer (followsYou)
    let followsViewer = new Set<string>();
    if (viewerId) {
      const fv = await this.prisma.follow.findMany({
        where: { followerId: { in: followerIds }, followingId: viewerId },
        select: { followerId: true },
      });
      followsViewer = new Set(fv.map((f) => f.followerId));
    }

    return follows.map((f) => ({
      ...f.follower,
      isFollowing: viewerFollowing.has(f.follower.id),
      followsYou: followsViewer.has(f.follower.id),
    }));
  }

  async getFollowing(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const follows = await this.prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, trustScore: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const followingIds = follows.map((f) => f.following.id);

    let viewerFollowing = new Set<string>();
    if (viewerId) {
      const vf = await this.prisma.follow.findMany({
        where: { followerId: viewerId, followingId: { in: followingIds } },
        select: { followingId: true },
      });
      viewerFollowing = new Set(vf.map((f) => f.followingId));
    }

    return follows.map((f) => ({
      ...f.following,
      isFollowing: viewerFollowing.has(f.following.id),
      followsYou: false,
    }));
  }

  async searchUsers(search: string, limit = 10) {
    return this.prisma.user.findMany({
      where: search ? {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
        ],
        status: 'active',
      } : { status: 'active' },
      select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true },
      orderBy: { trustScore: 'desc' },
      take: limit,
    });
  }

  async getTrending(limit = 10) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
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
