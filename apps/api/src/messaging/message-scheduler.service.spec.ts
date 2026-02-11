import { Test, TestingModule } from '@nestjs/testing';
import { MessageSchedulerService } from './message-scheduler.service';
import { MessagingService } from './messaging.service';
import { AppGateway } from '../gateway/app.gateway';

describe('MessageSchedulerService', () => {
  let scheduler: MessageSchedulerService;
  let messagingService: {
    processQueuedMessages: jest.Mock;
    deliverCalmModeMessages: jest.Mock;
  };
  let gateway: { deliverQueuedMessages: jest.Mock };

  beforeEach(async () => {
    messagingService = {
      processQueuedMessages: jest.fn(),
      deliverCalmModeMessages: jest.fn(),
    };
    gateway = {
      deliverQueuedMessages: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageSchedulerService,
        { provide: MessagingService, useValue: messagingService },
        { provide: AppGateway, useValue: gateway },
      ],
    }).compile();

    scheduler = module.get<MessageSchedulerService>(MessageSchedulerService);
  });

  describe('processTimeBoundaryQueue', () => {
    it('should not call gateway when no messages are queued', async () => {
      messagingService.processQueuedMessages.mockResolvedValue(new Map());

      await scheduler.processTimeBoundaryQueue();

      expect(messagingService.processQueuedMessages).toHaveBeenCalled();
      expect(gateway.deliverQueuedMessages).not.toHaveBeenCalled();
    });

    it('should deliver queued messages via gateway', async () => {
      const messages = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'sender-1',
          messageType: 'text',
          content: 'Hello',
          status: 'sent',
          queuedReason: null,
          deliverAt: null,
          createdAt: new Date(),
          deliveredAt: null,
          readAt: null,
          isOwnMessage: false,
        },
      ];
      const delivered = new Map([['recipient-1', messages]]);
      messagingService.processQueuedMessages.mockResolvedValue(delivered);

      await scheduler.processTimeBoundaryQueue();

      expect(gateway.deliverQueuedMessages).toHaveBeenCalledWith(delivered);
    });

    it('should handle errors gracefully', async () => {
      messagingService.processQueuedMessages.mockRejectedValue(new Error('DB error'));

      await expect(scheduler.processTimeBoundaryQueue()).resolves.not.toThrow();
    });
  });

  describe('handleCalmModeDeactivated', () => {
    it('should not call gateway when no calm-mode messages exist', async () => {
      messagingService.deliverCalmModeMessages.mockResolvedValue([]);

      await scheduler.handleCalmModeDeactivated({ userId: 'user-1' });

      expect(messagingService.deliverCalmModeMessages).toHaveBeenCalledWith('user-1');
      expect(gateway.deliverQueuedMessages).not.toHaveBeenCalled();
    });

    it('should deliver calm-mode messages via gateway', async () => {
      const messages = [
        {
          id: 'msg-2',
          conversationId: 'conv-2',
          senderId: 'sender-2',
          messageType: 'text',
          content: 'Hi there',
          status: 'sent',
          queuedReason: null,
          deliverAt: null,
          createdAt: new Date(),
          deliveredAt: null,
          readAt: null,
          isOwnMessage: false,
        },
      ];
      messagingService.deliverCalmModeMessages.mockResolvedValue(messages);

      await scheduler.handleCalmModeDeactivated({ userId: 'user-1' });

      expect(gateway.deliverQueuedMessages).toHaveBeenCalledWith(new Map([['user-1', messages]]));
    });

    it('should handle errors gracefully', async () => {
      messagingService.deliverCalmModeMessages.mockRejectedValue(new Error('DB error'));

      await expect(
        scheduler.handleCalmModeDeactivated({ userId: 'user-1' })
      ).resolves.not.toThrow();
    });
  });
});
