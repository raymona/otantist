import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StateService } from './state.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';
import { SocialEnergyLevel } from './dto';

describe('StateService', () => {
  let service: StateService;
  let prisma: MockPrismaService;

  const mockAccountWithUser = {
    id: 'account-id',
    user: { id: 'user-id' },
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [StateService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<StateService>(StateService);
  });

  describe('getCurrentState', () => {
    it('should return current user state', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.userState.findUnique
        .mockResolvedValueOnce(null) // ensureUserState check
        .mockResolvedValueOnce({
          socialEnergy: 'medium',
          energyUpdatedAt: new Date(),
          calmModeActive: false,
          calmModeStarted: null,
          isOnline: true,
          lastSeen: null,
        });
      prisma.userState.create.mockResolvedValue({});

      const result = await service.getCurrentState('account-id');

      expect(result.socialEnergy).toBe('medium');
      expect(result.calmModeActive).toBe(false);
      expect(result.isOnline).toBe(true);
    });

    it('should throw if user not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.getCurrentState('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('should create state if it does not exist', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.userState.findUnique
        .mockResolvedValueOnce(null) // ensureUserState
        .mockResolvedValueOnce(null); // getCurrentState read
      prisma.userState.create.mockResolvedValue({});

      const result = await service.getCurrentState('account-id');

      expect(prisma.userState.create).toHaveBeenCalledWith({
        data: { userId: 'user-id' },
      });
      expect(result.socialEnergy).toBeNull();
    });
  });

  describe('updateSocialEnergy', () => {
    it('should update social energy level', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.userState.findUnique
        .mockResolvedValueOnce({ userId: 'user-id' }) // ensureUserState
        .mockResolvedValueOnce({ userId: 'user-id' }) // ensureUserState (called again in getCurrentState)
        .mockResolvedValueOnce({
          socialEnergy: 'low',
          energyUpdatedAt: new Date(),
          calmModeActive: false,
          calmModeStarted: null,
          isOnline: false,
          lastSeen: null,
        });
      prisma.userState.update.mockResolvedValue({});
      prisma.userState.create.mockResolvedValue({});

      await service.updateSocialEnergy('account-id', SocialEnergyLevel.LOW);

      expect(prisma.userState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-id' },
          data: expect.objectContaining({ socialEnergy: 'low' }),
        })
      );
    });
  });

  describe('activateCalmMode', () => {
    it('should activate calm mode and return response', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.userState.findUnique.mockResolvedValue({ userId: 'user-id' });
      prisma.userState.update.mockResolvedValue({});
      prisma.parentManagedAccount.findFirst.mockResolvedValue(null);

      const result = await service.activateCalmMode('account-id');

      expect(result.active).toBe(true);
      expect(result.durationMinutes).toBe(0);
      expect(prisma.userState.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ calmModeActive: true }),
        })
      );
    });

    it('should create parent alert if account is managed', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.userState.findUnique.mockResolvedValue({ userId: 'user-id' });
      prisma.userState.update.mockResolvedValue({});
      prisma.parentManagedAccount.findFirst.mockResolvedValue({
        parentAccountId: 'parent-id',
        memberAccountId: 'account-id',
        status: 'active',
      });
      prisma.parentAlert.create.mockResolvedValue({});

      await service.activateCalmMode('account-id');

      expect(prisma.parentAlert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentAccountId: 'parent-id',
            memberUserId: 'user-id',
          }),
        })
      );
    });
  });

  describe('deactivateCalmMode', () => {
    it('should deactivate calm mode and return duration', async () => {
      const startedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.userState.findUnique
        .mockResolvedValueOnce({ userId: 'user-id' }) // ensureUserState
        .mockResolvedValueOnce({
          userId: 'user-id',
          calmModeActive: true,
          calmModeStarted: startedAt,
        });
      prisma.userState.update.mockResolvedValue({});
      prisma.memberIndicator.upsert.mockResolvedValue({});

      const result = await service.deactivateCalmMode('account-id');

      expect(result.active).toBe(false);
      expect(result.durationMinutes).toBeGreaterThanOrEqual(29);
    });
  });
});
