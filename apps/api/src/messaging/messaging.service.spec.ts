import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagingService } from './messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';

describe('MessagingService', () => {
  let service: MessagingService;
  let prisma: MockPrismaService;
  let eventEmitter: { emit: jest.Mock };

  const mockAccountWithUser = {
    id: 'account-id',
    user: { id: 'user-id' },
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: eventEmitter },
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

      await expect(service.listConversations('missing-id')).rejects.toThrow(NotFoundException);
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
      prisma.conversationHidden.deleteMany.mockResolvedValue({ count: 0 });
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
        })
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
        })
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
        })
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
      prisma.conversationHidden.deleteMany.mockResolvedValue({ count: 0 });
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
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('startConversation', () => {
    it('should throw when trying to start conversation with self', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);

      await expect(service.startConversation('account-id', 'user-id')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('deleteMessage (delete for me)', () => {
    it('should create a MessageDeletion record for the sender', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-id',
        senderId: 'user-id',
        conversation: {
          id: 'conv-id',
          userAId: 'user-id',
          userBId: 'other-user-id',
        },
      });
      prisma.messageDeletion.upsert.mockResolvedValue({});

      await service.deleteMessage('account-id', 'msg-id');

      expect(prisma.messageDeletion.upsert).toHaveBeenCalledWith({
        where: { messageId_userId: { messageId: 'msg-id', userId: 'user-id' } },
        create: { messageId: 'msg-id', userId: 'user-id' },
        update: {},
      });
    });

    it('should allow the recipient to delete a message for themselves', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-id',
        senderId: 'other-user-id',
        conversation: {
          id: 'conv-id',
          userAId: 'user-id',
          userBId: 'other-user-id',
        },
      });
      prisma.messageDeletion.upsert.mockResolvedValue({});

      await service.deleteMessage('account-id', 'msg-id');

      expect(prisma.messageDeletion.upsert).toHaveBeenCalled();
    });

    it('should throw if user is not in the conversation', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.message.findUnique.mockResolvedValue({
        id: 'msg-id',
        senderId: 'someone-else',
        conversation: {
          id: 'conv-id',
          userAId: 'other-1',
          userBId: 'other-2',
        },
      });

      await expect(service.deleteMessage('account-id', 'msg-id')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw if message not found', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.message.findUnique.mockResolvedValue(null);

      await expect(service.deleteMessage('account-id', 'missing-msg')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('hideConversation', () => {
    it('should create a ConversationHidden record', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-id',
        userAId: 'user-id',
        userBId: 'other-user-id',
      });
      prisma.conversationHidden.upsert.mockResolvedValue({});

      await service.hideConversation('account-id', 'conv-id');

      expect(prisma.conversationHidden.upsert).toHaveBeenCalledWith({
        where: { conversationId_userId: { conversationId: 'conv-id', userId: 'user-id' } },
        create: { conversationId: 'conv-id', userId: 'user-id' },
        update: {},
      });
    });

    it('should throw if conversation not found', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findUnique.mockResolvedValue(null);

      await expect(service.hideConversation('account-id', 'missing-conv')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw if user is not part of the conversation', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-id',
        userAId: 'other-1',
        userBId: 'other-2',
      });

      await expect(service.hideConversation('account-id', 'conv-id')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('unhideConversation', () => {
    it('should delete the ConversationHidden record', async () => {
      prisma.account.findUnique.mockResolvedValue(mockAccountWithUser);
      prisma.conversationHidden.deleteMany.mockResolvedValue({ count: 1 });

      await service.unhideConversation('account-id', 'conv-id');

      expect(prisma.conversationHidden.deleteMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-id', userId: 'user-id' },
      });
    });
  });

  describe('sendMessage auto-unhide', () => {
    it('should auto-unhide conversation for recipient and emit event', async () => {
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
      prisma.conversationHidden.deleteMany.mockResolvedValue({ count: 1 });
      prisma.memberIndicator.upsert.mockResolvedValue({});

      await service.sendMessage('account-id', 'conv-id', {
        content: 'Hello!',
        messageType: 'text' as any,
      });

      expect(prisma.conversationHidden.deleteMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-id', userId: 'other-user-id' },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('conversation.unhidden', {
        conversationId: 'conv-id',
        userId: 'other-user-id',
      });
    });

    it('should not emit event if conversation was not hidden', async () => {
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
      prisma.conversationHidden.deleteMany.mockResolvedValue({ count: 0 });
      prisma.memberIndicator.upsert.mockResolvedValue({});

      await service.sendMessage('account-id', 'conv-id', {
        content: 'Hello!',
        messageType: 'text' as any,
      });

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
