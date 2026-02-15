import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let prisma: MockPrismaService;

  const mockAccountWithUser = {
    id: 'account-id',
    user: { id: 'user-id' },
  };

  const mockUsersService = {
    updateOnboardingProgress: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreferencesService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
  });

  describe('getCommunicationPrefs', () => {
    it('should return communication preferences', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.communicationPreference.findUnique.mockResolvedValue({
        commModes: ['text', 'emoji'],
        preferredTone: 'gentle',
        slowRepliesOk: true,
        oneMessageAtTime: true,
        readWithoutReply: false,
        sectionComplete: true,
      });

      const result = await service.getCommunicationPrefs('account-id');

      expect(result.commModes).toEqual(['text', 'emoji']);
      expect(result.preferredTone).toBe('gentle');
      expect(result.sectionComplete).toBe(true);
    });

    it('should return defaults when no prefs exist', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.communicationPreference.findUnique.mockResolvedValue(null);

      const result = await service.getCommunicationPrefs('account-id');

      expect(result.commModes).toEqual([]);
      expect(result.preferredTone).toBeNull();
      expect(result.sectionComplete).toBe(false);
    });

    it('should throw if user not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(service.getCommunicationPrefs('missing-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCommunicationPrefs', () => {
    it('should upsert communication preferences', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.communicationPreference.upsert.mockResolvedValue({});
      prisma.communicationPreference.findUnique.mockResolvedValue({
        commModes: ['text'],
        preferredTone: 'direct',
        slowRepliesOk: true,
        oneMessageAtTime: false,
        readWithoutReply: null,
        sectionComplete: false,
      });

      const result = await service.updateCommunicationPrefs('account-id', {
        commModes: ['text'],
        preferredTone: 'direct' as any,
        slowRepliesOk: true,
      });

      expect(prisma.communicationPreference.upsert).toHaveBeenCalled();
      expect(result.commModes).toEqual(['text']);
    });
  });

  describe('getSensoryPrefs', () => {
    it('should return sensory preferences', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.sensoryPreference.findUnique.mockResolvedValue({
        enableAnimations: false,
        colorIntensity: 'reduced',
        soundEnabled: false,
        notificationLimit: 5,
        notificationGrouped: true,
        sectionComplete: true,
      });

      const result = await service.getSensoryPrefs('account-id');

      expect(result.enableAnimations).toBe(false);
      expect(result.colorIntensity).toBe('reduced');
      expect(result.sectionComplete).toBe(true);
    });

    it('should return defaults when no prefs exist', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.sensoryPreference.findUnique.mockResolvedValue(null);

      const result = await service.getSensoryPrefs('account-id');

      expect(result.enableAnimations).toBe(false);
      expect(result.soundEnabled).toBe(false);
      expect(result.notificationGrouped).toBe(true);
    });
  });

  describe('updateSensoryPrefs', () => {
    it('should upsert sensory preferences', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.sensoryPreference.upsert.mockResolvedValue({});
      prisma.sensoryPreference.findUnique.mockResolvedValue({
        enableAnimations: true,
        colorIntensity: 'standard',
        soundEnabled: true,
        notificationLimit: null,
        notificationGrouped: true,
        sectionComplete: false,
      });

      const result = await service.updateSensoryPrefs('account-id', {
        enableAnimations: true,
        soundEnabled: true,
      });

      expect(prisma.sensoryPreference.upsert).toHaveBeenCalled();
      expect(result.enableAnimations).toBe(true);
    });
  });

  describe('getTimeBoundaries', () => {
    it('should return time boundaries ordered by day', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.timeBoundary.findMany.mockResolvedValue([
        {
          dayOfWeek: 1,
          availableStart: '09:00',
          availableEnd: '17:00',
          timezone: 'America/Montreal',
        },
        {
          dayOfWeek: 2,
          availableStart: '10:00',
          availableEnd: '18:00',
          timezone: 'America/Montreal',
        },
      ]);

      const result = await service.getTimeBoundaries('account-id');

      expect(result).toHaveLength(2);
      expect(result[0].dayOfWeek).toBe(1);
      expect(result[0].availableStart).toBe('09:00');
    });
  });

  describe('getConversationStarters', () => {
    it('should return conversation starters', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversationStarter.findUnique.mockResolvedValue({
        goodTopics: ['music', 'coding'],
        avoidTopics: ['politics'],
        interactionTips: ['Be direct'],
        sectionComplete: true,
      });

      const result = await service.getConversationStarters('account-id');

      expect(result.goodTopics).toEqual(['music', 'coding']);
      expect(result.avoidTopics).toEqual(['politics']);
      expect(result.sectionComplete).toBe(true);
    });

    it('should return defaults when no starters exist', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversationStarter.findUnique.mockResolvedValue(null);

      const result = await service.getConversationStarters('account-id');

      expect(result.goodTopics).toEqual([]);
      expect(result.avoidTopics).toEqual([]);
      expect(result.sectionComplete).toBe(false);
    });
  });
});
