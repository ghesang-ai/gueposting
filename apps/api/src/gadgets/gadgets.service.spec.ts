import { Test } from '@nestjs/testing';
import { GadgetsService } from './gadgets.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  gadget: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('GadgetsService', () => {
  let service: GadgetsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GadgetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(GadgetsService);
    jest.clearAllMocks();
  });

  it('findAll should return array of gadgets', async () => {
    const gadgets = [{ id: '1', name: 'iPhone 15 Pro', brand: 'Apple' }];
    mockPrisma.gadget.findMany.mockResolvedValue(gadgets);
    const result = await service.findAll({ search: '', category: undefined });
    expect(result).toEqual(gadgets);
    expect(mockPrisma.gadget.findMany).toHaveBeenCalledTimes(1);
  });

  it('findOne should return null for unknown id', async () => {
    mockPrisma.gadget.findUnique.mockResolvedValue(null);
    const result = await service.findOne('unknown-id');
    expect(result).toBeNull();
  });
});
