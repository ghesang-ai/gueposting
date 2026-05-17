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
