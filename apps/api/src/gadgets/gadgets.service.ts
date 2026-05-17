import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GadgetCategory } from '@prisma/client';

interface FindAllOptions {
  search: string;
  category?: GadgetCategory;
  sort?: 'trending' | 'default';
  limit?: number;
}

interface CreateGadgetData {
  name: string;
  brand: string;
  category: GadgetCategory;
  imageUrl?: string;
}

@Injectable()
export class GadgetsService {
  constructor(private prisma: PrismaService) {}

  findAll({ search, category, sort, limit = 50 }: FindAllOptions) {
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
      orderBy: sort === 'trending'
        ? [{ avgScore: 'desc' }, { reviewCount: 'desc' }]
        : { reviewCount: 'desc' },
      take: limit,
    });
  }

  findTrending() {
    return this.prisma.gadget.findMany({
      where: { isTrending: true },
      orderBy: { trendingOrder: 'asc' },
      take: 6,
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

  async create(data: CreateGadgetData) {
    const existing = await this.prisma.gadget.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' }, brand: { equals: data.brand, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('Gadget sudah ada di database');
    return this.prisma.gadget.create({
      data: {
        name: data.name.trim(),
        brand: data.brand.trim(),
        category: data.category,
        imageUrl: data.imageUrl ?? null,
        specs: {},
      },
    });
  }
}
