import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';

describe('ModerationService', () => {
  let service: ModerationService;
  let prisma: MockPrismaService;

  const mockQueueItem = {
    id: 'queue-id',
    itemType: 'message',
    itemId: 'msg-id',
    flaggedBy: 'user',
    flagReason: 'harassment',
    aiConfidence: null,
    status: 'pending',
    priority: 'medium',
    actionTaken: null,
    resolutionNotes: null,
    createdAt: new Date(),
    resolvedAt: null,
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  describe('getQueue', () => {
    it('should return moderation queue items', async () => {
      prisma.moderationQueue.findMany.mockResolvedValue([mockQueueItem]);
      prisma.message.findUnique.mockResolvedValue({
        content: 'Bad message',
        sender: { id: 'sender-id', displayName: 'Sender' },
        conversation: { id: 'conv-id', userAId: 'a', userBId: 'b' },
        createdAt: new Date(),
      });

      const result = await service.getQueue();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('queue-id');
      expect(result[0].relatedContent).toBeTruthy();
    });

    it('should filter by status', async () => {
      prisma.moderationQueue.findMany.mockResolvedValue([]);

      await service.getQueue('pending');

      expect(prisma.moderationQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' }),
        }),
      );
    });

    it('should filter by priority', async () => {
      prisma.moderationQueue.findMany.mockResolvedValue([]);

      await service.getQueue(undefined, 'high');

      expect(prisma.moderationQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: 'high' }),
        }),
      );
    });
  });

  describe('resolveQueueItem', () => {
    it('should resolve a queue item with dismiss action', async () => {
      prisma.moderationQueue.findUnique
        .mockResolvedValueOnce(mockQueueItem)   // first call
        .mockResolvedValueOnce({                // second call in getQueueItem
          ...mockQueueItem,
          status: 'resolved',
          actionTaken: 'dismissed',
        });
      prisma.moderationQueue.update.mockResolvedValue({});
      prisma.message.findUnique.mockResolvedValue({
        content: 'Message',
        sender: { id: 's', displayName: 'S' },
        conversation: { id: 'c', userAId: 'a', userBId: 'b' },
        createdAt: new Date(),
      });

      const result = await service.resolveQueueItem(
        'queue-id',
        'reviewer-account-id',
        { action: 'dismissed' as any, notes: 'False positive' },
      );

      expect(prisma.moderationQueue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'resolved',
            actionTaken: 'dismissed',
          }),
        }),
      );
    });

    it('should remove message content when action is removed', async () => {
      prisma.moderationQueue.findUnique
        .mockResolvedValueOnce(mockQueueItem)
        .mockResolvedValueOnce({
          ...mockQueueItem,
          status: 'resolved',
          actionTaken: 'removed',
        });
      prisma.message.update.mockResolvedValue({});
      prisma.moderationQueue.update.mockResolvedValue({});
      prisma.message.findUnique.mockResolvedValue({
        content: '[Removed by moderator]',
        sender: { id: 's', displayName: 'S' },
        conversation: { id: 'c', userAId: 'a', userBId: 'b' },
        createdAt: new Date(),
      });

      await service.resolveQueueItem('queue-id', 'reviewer-id', {
        action: 'removed' as any,
      });

      expect(prisma.message.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg-id' },
          data: { content: '[Removed by moderator]', messageType: 'system' },
        }),
      );
    });

    it('should throw if queue item not found', async () => {
      prisma.moderationQueue.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveQueueItem('missing-id', 'reviewer-id', {
          action: 'dismissed' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return moderation statistics', async () => {
      prisma.moderationQueue.count
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(2)  // reviewing
        .mockResolvedValueOnce(10) // resolvedToday
        .mockResolvedValueOnce(50) // totalResolved
        .mockResolvedValueOnce(1)  // low
        .mockResolvedValueOnce(2)  // medium
        .mockResolvedValueOnce(1)  // high
        .mockResolvedValueOnce(1); // urgent

      const result = await service.getStats();

      expect(result.pending).toBe(5);
      expect(result.reviewing).toBe(2);
      expect(result.resolvedToday).toBe(10);
      expect(result.totalResolved).toBe(50);
      expect(result.byPriority).toEqual({
        low: 1,
        medium: 2,
        high: 1,
        urgent: 1,
      });
    });
  });
});
