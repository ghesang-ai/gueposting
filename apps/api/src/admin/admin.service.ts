import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [users, posts, gadgets, invites, pendingCompares, pendingUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.gadget.count(),
      this.prisma.invite.count({ where: { usedById: null, expiresAt: { gt: new Date() } } }),
      this.prisma.aiComparison.count({ where: { status: 'pending' } }),
      this.prisma.user.count({ where: { status: 'pending' } }),
    ]);
    return { users, posts, gadgets, activeInvites: invites, pendingCompares, pendingUsers };
  }

  async getPosts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          gadget: { select: { id: true, name: true, brand: true } },
        },
      }),
      this.prisma.post.count(),
    ]);
    return { data, total, page, limit };
  }

  async deletePost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post tidak ditemukan');
    await this.prisma.post.delete({ where: { id: postId } });
    return { message: 'Post berhasil dihapus' };
  }

  async getUsers(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;
    const where = search
      ? { OR: [{ username: { contains: search, mode: 'insensitive' as const } }, { displayName: { contains: search, mode: 'insensitive' as const } }] }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip, take: limit, where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, username: true, displayName: true, email: true,
          avatarUrl: true, trustScore: true, role: true, createdAt: true,
          _count: { select: { posts: true, followers: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getPendingUsers() {
    return this.prisma.user.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, username: true, displayName: true, email: true, phone: true,
        currentGadgetId: true, createdAt: true,
        _count: { select: { posts: true } },
      },
    });
  }

  async approveUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return this.prisma.user.update({ where: { id: userId }, data: { status: 'active' } });
  }

  async rejectUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'User ditolak dan dihapus' };
  }

  async updateTrustScore(userId: string, trustScore: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return this.prisma.user.update({ where: { id: userId }, data: { trustScore } });
  }

  async updateUserRole(userId: string, role: 'user' | 'admin') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    return this.prisma.user.update({ where: { id: userId }, data: { role } });
  }

  async getInvites(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.invite.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { username: true, displayName: true } },
          usedBy: { select: { username: true, displayName: true } },
        },
      }),
      this.prisma.invite.count(),
    ]);
    return { data, total, page, limit };
  }

  async createGadget(data: { name: string; brand: string; category: string; imageUrl?: string; specs?: object }) {
    try {
      return await this.prisma.gadget.create({ data: { ...data, category: data.category as any, specs: data.specs ?? {} } });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException(`Gadget "${data.name}" dari brand "${data.brand}" sudah ada`);
      throw e;
    }
  }

  async updateGadget(id: string, data: { name?: string; brand?: string; category?: string; imageUrl?: string; specs?: object }) {
    const gadget = await this.prisma.gadget.findUnique({ where: { id } });
    if (!gadget) throw new NotFoundException('Gadget tidak ditemukan');
    return this.prisma.gadget.update({ where: { id }, data: { ...data, category: data.category as any } });
  }

  async deleteGadget(id: string) {
    const gadget = await this.prisma.gadget.findUnique({ where: { id } });
    if (!gadget) throw new NotFoundException('Gadget tidak ditemukan');
    await this.prisma.gadget.delete({ where: { id } });
    return { message: 'Gadget berhasil dihapus' };
  }

  async getGadgets(search = '') {
    return this.prisma.gadget.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      } : {},
      orderBy: [{ isTrending: 'desc' }, { trendingOrder: 'asc' }, { reviewCount: 'desc' }],
      take: 50,
      select: { id: true, name: true, brand: true, category: true, imageUrl: true, isTrending: true, trendingOrder: true, avgScore: true, reviewCount: true },
    });
  }

  async setGadgetTrending(gadgetId: string, isTrending: boolean) {
    const gadget = await this.prisma.gadget.findUnique({ where: { id: gadgetId } });
    if (!gadget) throw new NotFoundException('Gadget tidak ditemukan');

    if (isTrending) {
      const count = await this.prisma.gadget.count({ where: { isTrending: true } });
      if (count >= 6) throw new ForbiddenException('Maksimal 6 gadget trending');
      const maxOrder = await this.prisma.gadget.aggregate({ where: { isTrending: true }, _max: { trendingOrder: true } });
      return this.prisma.gadget.update({ where: { id: gadgetId }, data: { isTrending: true, trendingOrder: (maxOrder._max.trendingOrder ?? 0) + 1 } });
    } else {
      return this.prisma.gadget.update({ where: { id: gadgetId }, data: { isTrending: false, trendingOrder: null } });
    }
  }

  async createInvite(adminId: string, count = 1) {
    const codes = await Promise.all(
      Array.from({ length: count }).map(() => {
        const code = `GUEPOSTING-${nanoid(8).toUpperCase()}`;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return this.prisma.invite.create({ data: { code, createdById: adminId, expiresAt } });
      }),
    );
    return codes;
  }

  async getActivityStats() {
    const days = 7;
    const now = new Date();
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      const [users, posts, gadgets] = await Promise.all([
        this.prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
        this.prisma.post.count({ where: { createdAt: { gte: start, lte: end } } }),
        this.prisma.gadget.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]);
      result.push({
        date: start.toISOString().split('T')[0],
        label: start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        users,
        posts,
        gadgets,
      });
    }
    return result;
  }
}
