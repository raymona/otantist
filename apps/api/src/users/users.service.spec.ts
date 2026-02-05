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
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
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

      await expect(service.getProfile('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user not linked', async () => {
      prisma.account.findUnique.mockResolvedValue({
        ...mockAccount,
        user: null,
      });

      await expect(service.getProfile('account-id')).rejects.toThrow(
        NotFoundException,
      );
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

      await expect(
        service.updateProfile('missing-id', { displayName: 'Name' }),
      ).rejects.toThrow(NotFoundException);
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

      await expect(
        service.getOnboardingStatus('missing-id'),
      ).rejects.toThrow(NotFoundException);
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
});
