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
