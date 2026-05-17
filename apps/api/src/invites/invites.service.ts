import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { nanoid } from 'nanoid';

@Injectable()
export class InvitesService {
  constructor(private prisma: PrismaService) {}

  async create(createdById: string) {
    const code = `GUEPOSTING-${nanoid(8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return this.prisma.invite.create({ data: { code, createdById, expiresAt } });
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
