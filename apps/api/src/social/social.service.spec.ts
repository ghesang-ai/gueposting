import { Test } from '@nestjs/testing';
import { SocialService } from './social.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  follow: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  user: { findUnique: jest.fn() },
  post: { findMany: jest.fn() },
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
