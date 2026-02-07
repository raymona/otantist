import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';

describe('SafetyService', () => {
  let service: SafetyService;
  let prisma: MockPrismaService;

  const mockAccountWithUser = {
    id: 'account-id',
    user: { id: 'user-id' },
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SafetyService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<SafetyService>(SafetyService);
  });

  describe('blockUser', () => {
    it('should block a user and archive conversations', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.user.findUnique.mockResolvedValue({
        id: 'target-user-id',
        displayName: 'Target',
      });
      prisma.blockedUser.findUnique.mockResolvedValue(null);
      // $transaction passes mock through
      prisma.blockedUser.create.mockResolvedValue({});
      prisma.conversation.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.blockUser('account-id', 'target-user-id');

      expect(result.id).toBe('target-user-id');
      expect(result.displayName).toBe('Target');
    });

    it('should throw when blocking self', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);

      await expect(service.blockUser('account-id', 'user-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw when target user not found', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.blockUser('account-id', 'nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw when user already blocked', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.user.findUnique.mockResolvedValue({
        id: 'target-user-id',
        displayName: 'Target',
      });
      prisma.blockedUser.findUnique.mockResolvedValue({
        id: 'block-id',
        blockerId: 'user-id',
        blockedId: 'target-user-id',
      });

      await expect(service.blockUser('account-id', 'target-user-id')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('unblockUser', () => {
    it('should unblock a user', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.blockedUser.findUnique
        .mockResolvedValueOnce({
          id: 'block-id',
          blockerId: 'user-id',
          blockedId: 'target-user-id',
        }) // first call in unblockUser
        .mockResolvedValueOnce(null); // reverse block check in $transaction
      prisma.blockedUser.delete.mockResolvedValue({});
      prisma.conversation.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.unblockUser('account-id', 'target-user-id')).resolves.toBeUndefined();
    });

    it('should throw when user is not blocked', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.blockedUser.findUnique.mockResolvedValue(null);

      await expect(service.unblockUser('account-id', 'target-user-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('submitReport', () => {
    it('should submit a user report', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.user.findUnique.mockResolvedValue({
        id: 'reported-user-id',
        displayName: 'Reported',
      });
      prisma.userReport.create.mockResolvedValue({
        id: 'report-id',
        reason: 'harassment',
        description: 'Rude messages',
        createdAt: new Date(),
      });
      prisma.moderationQueue.create.mockResolvedValue({});

      const result = await service.submitReport('account-id', {
        reportedUserId: 'reported-user-id',
        reason: 'harassment' as any,
        description: 'Rude messages',
      });

      expect(result.id).toBe('report-id');
      expect(result.reason).toBe('harassment');
      expect(prisma.moderationQueue.create).toHaveBeenCalled();
    });

    it('should submit a message report and flag the message', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-id',
        content: 'Bad message',
        conversation: { id: 'conv-id' },
      });
      prisma.message.update.mockResolvedValue({});
      prisma.userReport.create.mockResolvedValue({
        id: 'report-id',
        reason: 'inappropriate',
        description: null,
        createdAt: new Date(),
      });
      prisma.moderationQueue.create.mockResolvedValue({});

      await service.submitReport('account-id', {
        reportedMessageId: 'msg-id',
        reason: 'inappropriate' as any,
      });

      expect(prisma.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg-id' },
          data: expect.objectContaining({ flagged: true }),
        })
      );
    });

    it('should throw when neither user nor message provided', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);

      await expect(
        service.submitReport('account-id', {
          reason: 'spam' as any,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when reporting self', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-id',
        displayName: 'Self',
      });

      await expect(
        service.submitReport('account-id', {
          reportedUserId: 'user-id',
          reason: 'harassment' as any,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
