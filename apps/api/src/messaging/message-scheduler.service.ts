import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { MessagingService } from './messaging.service';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class MessageSchedulerService {
  private readonly logger = new Logger(MessageSchedulerService.name);

  constructor(
    private messagingService: MessagingService,
    @Inject(forwardRef(() => AppGateway))
    private gateway: AppGateway
  ) {
    this.logger.log('Message scheduler initialized');
  }

  /**
   * Every 60 seconds, deliver time-boundary-queued messages whose deliverAt has passed.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processTimeBoundaryQueue() {
    try {
      const delivered = await this.messagingService.processQueuedMessages();

      if (delivered.size > 0) {
        let totalCount = 0;
        for (const messages of delivered.values()) {
          totalCount += messages.length;
        }
        this.logger.log(`Delivered ${totalCount} time-boundary-queued message(s)`);

        this.gateway.deliverQueuedMessages(delivered);
      }
    } catch (error) {
      this.logger.error('Failed to process queued messages', error);
    }
  }

  /**
   * When calm mode is deactivated, immediately deliver all calm-mode-queued messages.
   */
  @OnEvent('calm_mode.deactivated')
  async handleCalmModeDeactivated(payload: { userId: string }) {
    try {
      const messages = await this.messagingService.deliverCalmModeMessages(payload.userId);

      if (messages.length > 0) {
        this.logger.log(
          `Delivered ${messages.length} calm-mode-queued message(s) to user ${payload.userId}`
        );

        const grouped = new Map<string, typeof messages>();
        grouped.set(payload.userId, messages);
        this.gateway.deliverQueuedMessages(grouped);
      }
    } catch (error) {
      this.logger.error(`Failed to deliver calm-mode messages for user ${payload.userId}`, error);
    }
  }
}
