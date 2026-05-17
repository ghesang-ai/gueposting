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
  follow: { findMany: jest.fn() },
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
