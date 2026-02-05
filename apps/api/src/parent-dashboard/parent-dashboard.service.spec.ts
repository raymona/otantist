import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ParentDashboardService } from './parent-dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';

describe('ParentDashboardService', () => {
  let service: ParentDashboardService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentDashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ParentDashboardService>(ParentDashboardService);
  });

  describe('getManagedMembers', () => {
    it('should return managed members', async () => {
      prisma.parentManagedAccount.findMany.mockResolvedValue([
        {
          id: 'rel-id',
          memberAccountId: 'member-account-id',
          relationship: 'parent',
          status: 'active',
          consentGivenAt: new Date(),
          createdAt: new Date(),
          memberAccount: {
            status: 'active',
            user: { id: 'member-user-id', displayName: 'Child' },
          },
        },
      ]);

      const result = await service.getManagedMembers('parent-account-id');

      expect(result).toHaveLength(1);
      expect(result[0].member.displayName).toBe('Child');
      expect(result[0].relationship).toBe('parent');
    });

    it('should return empty array when no managed members', async () => {
      prisma.parentManagedAccount.findMany.mockResolvedValue([]);

      const result = await service.getManagedMembers('parent-account-id');

      expect(result).toEqual([]);
    });
  });

  describe('getMemberAlerts', () => {
    it('should return alerts for managed member', async () => {
      // verifyParentAccess
      prisma.user.findUnique.mockResolvedValue({
        accountId: 'member-account-id',
      });
      prisma.parentManagedAccount.findUnique.mockResolvedValue({
        parentAccountId: 'parent-account-id',
        memberAccountId: 'member-account-id',
        status: 'active',
      });

      prisma.parentAlert.findMany.mockResolvedValue([
        {
          id: 'alert-id',
          alertType: 'stress_indicator',
          severity: 'info',
          messageFr: 'Mode calme activé',
          messageEn: 'Calm mode activated',
          acknowledged: false,
          acknowledgedAt: null,
          createdAt: new Date(),
        },
      ]);

      const result = await service.getMemberAlerts(
        'parent-account-id',
        'member-user-id',
      );

      expect(result).toHaveLength(1);
      expect(result[0].alertType).toBe('stress_indicator');
    });

    it('should throw if parent does not have access', async () => {
      prisma.user.findUnique.mockResolvedValue({
        accountId: 'member-account-id',
      });
      prisma.parentManagedAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.getMemberAlerts('wrong-parent-id', 'member-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if member not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getMemberAlerts('parent-account-id', 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert', async () => {
      // verifyParentAccess
      prisma.user.findUnique.mockResolvedValue({
        accountId: 'member-account-id',
      });
      prisma.parentManagedAccount.findUnique.mockResolvedValue({
        parentAccountId: 'parent-account-id',
        memberAccountId: 'member-account-id',
        status: 'active',
      });

      prisma.parentAlert.findUnique.mockResolvedValue({
        id: 'alert-id',
        parentAccountId: 'parent-account-id',
        acknowledged: false,
      });
      prisma.parentAlert.update.mockResolvedValue({
        id: 'alert-id',
        alertType: 'stress_indicator',
        severity: 'info',
        messageFr: 'Mode calme activé',
        messageEn: 'Calm mode activated',
        acknowledged: true,
        acknowledgedAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.acknowledgeAlert(
        'parent-account-id',
        'member-user-id',
        'alert-id',
      );

      expect(result.acknowledged).toBe(true);
    });

    it('should throw if alert not found', async () => {
      // verifyParentAccess
      prisma.user.findUnique.mockResolvedValue({
        accountId: 'member-account-id',
      });
      prisma.parentManagedAccount.findUnique.mockResolvedValue({
        parentAccountId: 'parent-account-id',
        memberAccountId: 'member-account-id',
        status: 'active',
      });

      prisma.parentAlert.findUnique.mockResolvedValue(null);

      await expect(
        service.acknowledgeAlert(
          'parent-account-id',
          'member-user-id',
          'missing-alert-id',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if alert belongs to different parent', async () => {
      // verifyParentAccess
      prisma.user.findUnique.mockResolvedValue({
        accountId: 'member-account-id',
      });
      prisma.parentManagedAccount.findUnique.mockResolvedValue({
        parentAccountId: 'parent-account-id',
        memberAccountId: 'member-account-id',
        status: 'active',
      });

      prisma.parentAlert.findUnique.mockResolvedValue({
        id: 'alert-id',
        parentAccountId: 'other-parent-id',
        acknowledged: false,
      });

      await expect(
        service.acknowledgeAlert(
          'parent-account-id',
          'member-user-id',
          'alert-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMemberIndicators', () => {
    it('should return member indicators', async () => {
      // verifyParentAccess
      prisma.user.findUnique.mockResolvedValue({
        accountId: 'member-account-id',
      });
      prisma.parentManagedAccount.findUnique.mockResolvedValue({
        parentAccountId: 'parent-account-id',
        memberAccountId: 'member-account-id',
        status: 'active',
      });

      prisma.memberIndicator.findMany.mockResolvedValue([
        {
          recordedAt: new Date(),
          socialEnergyAvg: 'medium',
          calmModeMinutes: 15,
          messagesSent: 10,
          messagesReceived: 8,
        },
      ]);

      const result = await service.getMemberIndicators(
        'parent-account-id',
        'member-user-id',
      );

      expect(result).toHaveLength(1);
      expect(result[0].calmModeMinutes).toBe(15);
      expect(result[0].messagesSent).toBe(10);
    });
  });
});
