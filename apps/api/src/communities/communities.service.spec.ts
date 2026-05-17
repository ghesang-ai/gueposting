import { Test } from '@nestjs/testing';
import { CommunitiesService } from './communities.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  community: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  communityMember: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
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
