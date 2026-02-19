import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrismaService;

  const mockAccount = {
    id: 'account-id',
    email: 'test@example.com',
    emailVerified: true,
    legalAcceptedAt: new Date(),
    preferredLanguage: 'en',
    createdAt: new Date(),
    parentManagedAsParent: [],
    user: {
      id: 'user-id',
      accountId: 'account-id',
      displayName: 'TestUser',
      ageGroup: 'age_18_25',
      profileVisibility: 'visible',
      onboardingComplete: false,
      onboardingStep: 'communication_preferences',
    },
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccount);

      const result = await service.getProfile('account-id');

      expect(result.id).toBe('user-id');
      expect(result.displayName).toBe('TestUser');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if account not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if user not linked', async () => {
      prisma.account.findUnique.mockResolvedValue({
        ...mockAccount,
        user: null,
      });

      await expect(service.getProfile('account-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile and return updated data', async () => {
      prisma.account.findUnique
        .mockResolvedValueOnce(mockAccount) // first call in updateProfile
        .mockResolvedValueOnce(mockAccount) // second call: updateOnboardingProgress -> getProfile
        .mockResolvedValueOnce(mockAccount); // third call: getProfile at end
      prisma.user.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        ...mockAccount.user,
        account: mockAccount,
        communicationPrefs: null,
        sensoryPrefs: null,
        conversationStarters: null,
      });

      const result = await service.updateProfile('account-id', {
        displayName: 'NewName',
        ageGroup: 'age_18_25' as any,
      });

      expect(result.displayName).toBe('TestUser');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw if user not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile('missing-id', { displayName: 'Name' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return onboarding status with step details', async () => {
      prisma.account.findUnique.mockResolvedValue({
        ...mockAccount,
        user: {
          ...mockAccount.user,
          communicationPrefs: { sectionComplete: true },
          sensoryPrefs: { sectionComplete: false },
          conversationStarters: { sectionComplete: false },
        },
      });

      const result = await service.getOnboardingStatus('account-id');

      expect(result.steps.emailVerified).toBe(true);
      expect(result.steps.legalAccepted).toBe(true);
      expect(result.steps.basicProfile).toBe(true);
      expect(result.steps.communicationPrefs).toBe(true);
      expect(result.steps.sensoryPrefs).toBe(false);
    });

    it('should throw if user not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.getOnboardingStatus('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateLanguage', () => {
    it('should update language preference', async () => {
      prisma.account.update.mockResolvedValue({
        preferredLanguage: 'fr',
      });

      const result = await service.updateLanguage('account-id', 'fr');
      expect(result.language).toBe('fr');
    });
  });

  describe('getDirectory', () => {
    const requestingUser = {
      id: 'user-id',
      accountId: 'account-id',
      displayName: 'Requester',
    };

    const directoryUsers = [
      {
        id: 'user-2',
        displayName: 'Alice',
        profileVisibility: 'visible',
        onboardingComplete: true,
        state: {
          isOnline: true,
          lastSeen: null,
          socialEnergy: 'high',
          calmModeActive: false,
        },
      },
      {
        id: 'user-3',
        displayName: 'Bob',
        profileVisibility: 'visible',
        onboardingComplete: true,
        state: {
          isOnline: false,
          lastSeen: new Date('2026-01-01'),
          socialEnergy: 'low',
          calmModeActive: true,
        },
      },
    ];

    beforeEach(() => {
      prisma.account.findUnique.mockResolvedValue({
        ...mockAccount,
        user: requestingUser,
      });
      prisma.blockedUser.findMany.mockResolvedValue([]);
    });

    it('should return onboarded, non-hidden users excluding self', async () => {
      prisma.user.findMany.mockResolvedValue(directoryUsers);

      const result = await service.getDirectory('account-id');

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.users[0].displayName).toBe('Alice');
      expect(result.users[0].isOnline).toBe(true);
      expect(result.users[1].displayName).toBe('Bob');
      expect(result.users[1].calmModeActive).toBe(true);

      // Verify the where clause excludes self and hidden profiles
      const findManyCall = prisma.user.findMany.mock.calls[0][0];
      expect(findManyCall.where.onboardingComplete).toBe(true);
      expect(findManyCall.where.profileVisibility).toEqual({ not: 'hidden' });
      expect(findManyCall.where.id.notIn).toContain('user-id');
    });

    it('should exclude blocked users (both directions)', async () => {
      prisma.blockedUser.findMany.mockResolvedValue([
        { blockerId: 'user-id', blockedId: 'user-blocked' },
        { blockerId: 'user-blocker', blockedId: 'user-id' },
      ]);
      prisma.user.findMany.mockResolvedValue([]);

      await service.getDirectory('account-id');

      const findManyCall = prisma.user.findMany.mock.calls[0][0];
      expect(findManyCall.where.id.notIn).toContain('user-blocked');
      expect(findManyCall.where.id.notIn).toContain('user-blocker');
      expect(findManyCall.where.id.notIn).toContain('user-id');
    });

    it('should filter by displayName when search is provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getDirectory('account-id', 'alice');

      const findManyCall = prisma.user.findMany.mock.calls[0][0];
      expect(findManyCall.where.displayName).toEqual({
        contains: 'alice',
        mode: 'insensitive',
      });
    });

    it('should not add displayName filter when search is empty', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.getDirectory('account-id', '  ');

      const findManyCall = prisma.user.findMany.mock.calls[0][0];
      expect(findManyCall.where.displayName).toBeUndefined();
    });

    it('should throw NotFoundException if requesting user not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.getDirectory('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle users with no state', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'user-no-state',
          displayName: 'NoState',
          state: null,
        },
      ]);

      const result = await service.getDirectory('account-id');

      expect(result.users[0].isOnline).toBe(false);
      expect(result.users[0].lastSeen).toBeNull();
      expect(result.users[0].socialEnergy).toBeNull();
      expect(result.users[0].calmModeActive).toBe(false);
    });
  });
});
