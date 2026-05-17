import { Test } from '@nestjs/testing';
import { InvitesService } from './invites.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockPrisma = {
  invite: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

describe('InvitesService', () => {
  let service: InvitesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InvitesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(InvitesService);
    jest.clearAllMocks();
  });

  it('create should generate invite with 7-day expiry', async () => {
    const now = Date.now();
    mockPrisma.invite.create.mockResolvedValue({ id: '1', code: 'GUEPOSTING-ABCD12', expiresAt: new Date(now + 7 * 86400000) });
    const invite = await service.create('user-1');
    const expiryDiff = invite.expiresAt.getTime() - now;
    expect(expiryDiff).toBeGreaterThan(6 * 86400000);
    expect(invite.code).toMatch(/^GUEPOSTING-/);
  });

  it('redeem should throw if code expired', async () => {
    mockPrisma.invite.findUnique.mockResolvedValue({
      id: '1', code: 'GUEPOSTING-ABCD12', usedById: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(service.redeem('GUEPOSTING-ABCD12', 'user-2')).rejects.toThrow(BadRequestException);
  });
});
