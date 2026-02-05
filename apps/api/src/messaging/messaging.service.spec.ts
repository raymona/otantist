import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';

describe('MessagingService', () => {
  let service: MessagingService;
  let prisma: MockPrismaService;

  const mockAccountWithUser = {
    id: 'account-id',
    user: { id: 'user-id' },
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MessagingService>(MessagingService);
  });

  describe('listConversations', () => {
    it('should return conversations for user', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findMany.mockResolvedValue([
        {
          id: 'conv-id',
          userAId: 'user-id',
          userBId: 'other-user-id',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          userA: { id: 'user-id', displayName: 'Me', state: null },
          userB: {
            id: 'other-user-id',
            displayName: 'Other',
            state: { isOnline: true, lastSeen: null, socialEnergy: 'high', calmModeActive: false },
          },
          messages: [
            {
              id: 'msg-id',
              content: 'Hello',
              createdAt: new Date(),
              senderId: 'user-id',
              status: 'sent',
            },
          ],
        },
      ]);
      prisma.message.count.mockResolvedValue(0);

      const result = await service.listConversations('account-id');

      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].otherUser.displayName).toBe('Other');
      expect(result.total).toBe(1);
    });

    it('should throw if user not found', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(
        service.listConversations('missing-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-id',
        userAId: 'user-id',
        userBId: 'other-user-id',
        status: 'active',
        userA: {
          id: 'user-id',
          state: null,
          account: {},
          timeBoundaries: [],
        },
        userB: {
          id: 'other-user-id',
          state: { calmModeActive: false },
          account: {},
          timeBoundaries: [],
        },
      });
      prisma.blockedUser.findFirst.mockResolvedValue(null);
      prisma.message.create.mockResolvedValue({
        id: 'new-msg-id',
        conversationId: 'conv-id',
        senderId: 'user-id',
        messageType: 'text',
        content: 'Hello!',
        status: 'sent',
        queuedReason: null,
        deliverAt: null,
        createdAt: new Date(),
        deliveredAt: null,
        readAt: null,
      });
      prisma.conversation.update.mockResolvedValue({});
      prisma.memberIndicator.upsert.mockResolvedValue({});

      const result = await service.sendMessage('account-id', 'conv-id', {
        content: 'Hello!',
        messageType: 'text' as any,
      });

      expect(result.queued).toBe(false);
      expect(result.message.content).toBe('Hello!');
    });

    it('should throw if conversation not found', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage('account-id', 'missing-conv', {
          content: 'Hi',
          messageType: 'text' as any,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw if user not part of conversation', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-id',
        userAId: 'other-1',
        userBId: 'other-2',
        status: 'active',
        userA: { id: 'other-1', state: null, account: {}, timeBoundaries: [] },
        userB: { id: 'other-2', state: null, account: {}, timeBoundaries: [] },
      });

      await expect(
        service.sendMessage('account-id', 'conv-id', {
          content: 'Hi',
          messageType: 'text' as any,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw if conversation is blocked', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-id',
        userAId: 'user-id',
        userBId: 'other-user-id',
        status: 'blocked',
        userA: { id: 'user-id', state: null, account: {}, timeBoundaries: [] },
        userB: { id: 'other-user-id', state: null, account: {}, timeBoundaries: [] },
      });

      await expect(
        service.sendMessage('account-id', 'conv-id', {
          content: 'Hi',
          messageType: 'text' as any,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should queue message when recipient is in calm mode', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-id',
        userAId: 'user-id',
        userBId: 'other-user-id',
        status: 'active',
        userA: { id: 'user-id', state: null, account: {}, timeBoundaries: [] },
        userB: {
          id: 'other-user-id',
          state: { calmModeActive: true },
          account: {},
          timeBoundaries: [],
        },
      });
      prisma.blockedUser.findFirst.mockResolvedValue(null);
      prisma.message.create.mockResolvedValue({
        id: 'queued-msg-id',
        conversationId: 'conv-id',
        senderId: 'user-id',
        messageType: 'text',
        content: 'Hello!',
        status: 'queued',
        queuedReason: 'recipient_calm_mode',
        deliverAt: null,
        createdAt: new Date(),
        deliveredAt: null,
        readAt: null,
      });
      prisma.conversation.update.mockResolvedValue({});
      prisma.memberIndicator.upsert.mockResolvedValue({});

      const result = await service.sendMessage('account-id', 'conv-id', {
        content: 'Hello!',
        messageType: 'text' as any,
      });

      expect(result.queued).toBe(true);
      expect(result.reason).toBe('recipient_calm_mode');
    });

    it('should throw if user is blocked', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-id',
        userAId: 'user-id',
        userBId: 'other-user-id',
        status: 'active',
        userA: { id: 'user-id', state: null, account: {}, timeBoundaries: [] },
        userB: {
          id: 'other-user-id',
          state: { calmModeActive: false },
          account: {},
          timeBoundaries: [],
        },
      });
      prisma.blockedUser.findFirst.mockResolvedValue({
        id: 'block-id',
        blockerId: 'other-user-id',
        blockedId: 'user-id',
      });

      await expect(
        service.sendMessage('account-id', 'conv-id', {
          content: 'Hi',
          messageType: 'text' as any,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('startConversation', () => {
    it('should throw when trying to start conversation with self', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);

      await expect(
        service.startConversation('account-id', 'user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
