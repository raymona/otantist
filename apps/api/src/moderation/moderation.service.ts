import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { ParentDashboardService } from '../parent-dashboard/parent-dashboard.service';
import { ResolveQueueItemDto, ModerationQueueItemResponse, ModerationStatsResponse } from './dto';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private parentDashboard: ParentDashboardService
  ) {}

  async getQueue(status?: string, priority?: string): Promise<ModerationQueueItemResponse[]> {
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const items = await this.prisma.moderationQueue.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: 200,
    });

    return Promise.all(
      items.map(async item => {
        const relatedContent = await this.getRelatedContent(item.itemType, item.itemId);

        return {
          id: item.id,
          itemType: item.itemType,
          itemId: item.itemId,
          flaggedBy: item.flaggedBy,
          flagReason: item.flagReason,
          aiConfidence: item.aiConfidence ? Number(item.aiConfidence) : null,
          status: item.status,
          priority: item.priority,
          actionTaken: item.actionTaken,
          resolutionNotes: item.resolutionNotes,
          originalContent: item.originalContent,
          createdAt: item.createdAt,
          resolvedAt: item.resolvedAt,
          relatedContent,
        };
      })
    );
  }

  async getQueueItem(id: string): Promise<ModerationQueueItemResponse> {
    const item = await this.prisma.moderationQueue.findUnique({
      where: { id },
      include: {
        reviewedBy: { select: { email: true } },
      },
    });

    if (!item) {
      throw new NotFoundException({
        code: 'QUEUE_ITEM_NOT_FOUND',
        message_en: 'Queue item not found',
        message_fr: 'Élément de file introuvable',
      });
    }

    const relatedContent = await this.getRelatedContentDetailed(item.itemType, item.itemId);

    return {
      id: item.id,
      itemType: item.itemType,
      itemId: item.itemId,
      flaggedBy: item.flaggedBy,
      flagReason: item.flagReason,
      aiConfidence: item.aiConfidence ? Number(item.aiConfidence) : null,
      status: item.status,
      priority: item.priority,
      actionTaken: item.actionTaken,
      resolutionNotes: item.resolutionNotes,
      originalContent: item.originalContent,
      createdAt: item.createdAt,
      resolvedAt: item.resolvedAt,
      reviewerEmail: item.reviewedBy?.email ?? null,
      relatedContent,
    };
  }

  async resolveQueueItem(
    id: string,
    reviewerAccountId: string,
    dto: ResolveQueueItemDto
  ): Promise<ModerationQueueItemResponse> {
    const item = await this.prisma.moderationQueue.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException({
        code: 'QUEUE_ITEM_NOT_FOUND',
        message_en: 'Queue item not found',
        message_fr: 'Élément de file introuvable',
      });
    }

    let originalContent: string | null = null;

    // ── REMOVED: preserve original content, replace message, auto-warn ──
    if (dto.action === 'removed' && item.itemType === 'message') {
      const message = await this.prisma.message.findUnique({
        where: { id: item.itemId },
        include: {
          sender: { include: { account: true } },
          conversation: true,
        },
      });

      if (message) {
        originalContent = message.content;

        await this.prisma.message.update({
          where: { id: item.itemId },
          data: {
            content: '[moderation_message_removed]',
            messageType: 'system',
          },
        });

        // Increment warning count on sender (removed = automatic warning)
        await this.prisma.user.update({
          where: { id: message.senderId },
          data: { warningCount: { increment: 1 } },
        });

        // Send system message into the conversation
        await this.insertSystemMessage(
          message.conversationId,
          message.senderId,
          'moderation_message_removed'
        );

        // Parent alert if sender is a managed minor
        await this.createModerationParentAlert(
          message.sender.accountId,
          message.senderId,
          'removed',
          message.sender.displayName
        );
      }
    }

    // ── WARNED: increment warning count, send system message ──
    if (dto.action === 'warned') {
      const targetInfo = await this.getTargetUserInfo(item.itemType, item.itemId);
      if (targetInfo) {
        await this.prisma.user.update({
          where: { id: targetInfo.userId },
          data: { warningCount: { increment: 1 } },
        });

        if (targetInfo.conversationId) {
          await this.insertSystemMessage(
            targetInfo.conversationId,
            targetInfo.userId,
            'moderation_user_warned'
          );
        }

        await this.createModerationParentAlert(
          targetInfo.accountId,
          targetInfo.userId,
          'warned',
          targetInfo.displayName
        );
      }
    }

    // ── SUSPENDED: disable account, send system messages ──
    if (dto.action === 'suspended') {
      const targetInfo = await this.getTargetUserInfo(item.itemType, item.itemId);
      if (targetInfo) {
        await this.prisma.account.update({
          where: { id: targetInfo.accountId },
          data: { status: 'suspended' },
        });

        // Send system message to all active conversations
        const conversations = await this.prisma.conversation.findMany({
          where: {
            OR: [{ userAId: targetInfo.userId }, { userBId: targetInfo.userId }],
            status: 'active',
          },
        });

        for (const conv of conversations) {
          await this.insertSystemMessage(conv.id, targetInfo.userId, 'moderation_user_suspended');
        }

        await this.createModerationParentAlert(
          targetInfo.accountId,
          targetInfo.userId,
          'suspended',
          targetInfo.displayName
        );
      }
    }

    // Update queue item
    await this.prisma.moderationQueue.update({
      where: { id },
      data: {
        status: 'resolved',
        actionTaken: dto.action,
        resolutionNotes: dto.notes,
        originalContent,
        reviewedById: reviewerAccountId,
        resolvedAt: new Date(),
      },
    });

    return this.getQueueItem(id);
  }

  /**
   * Get the target user info from either a message or user item.
   */
  private async getTargetUserInfo(
    itemType: string,
    itemId: string
  ): Promise<{
    userId: string;
    accountId: string;
    displayName: string | null;
    conversationId: string | null;
  } | null> {
    if (itemType === 'message') {
      const message = await this.prisma.message.findUnique({
        where: { id: itemId },
        include: { sender: { include: { account: true } } },
      });
      if (!message) return null;
      return {
        userId: message.senderId,
        accountId: message.sender.accountId,
        displayName: message.sender.displayName,
        conversationId: message.conversationId,
      };
    }

    if (itemType === 'user') {
      const user = await this.prisma.user.findUnique({
        where: { id: itemId },
        include: { account: true },
      });
      if (!user) return null;
      return {
        userId: user.id,
        accountId: user.accountId,
        displayName: user.displayName,
        conversationId: null,
      };
    }

    return null;
  }

  /**
   * Insert a system message into a conversation and emit via Socket.io.
   */
  private async insertSystemMessage(
    conversationId: string,
    senderId: string,
    contentKey: string
  ): Promise<void> {
    try {
      const message = await this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          messageType: 'system',
          content: contentKey,
          status: 'sent',
        },
      });

      this.eventEmitter.emit('moderation.system_message', {
        conversationId,
        message: {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          messageType: message.messageType,
          content: message.content,
          status: message.status,
          createdAt: message.createdAt,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to insert system message: ${(error as Error).message}`);
    }
  }

  /**
   * Create a parent alert if the target user is a managed minor.
   */
  private async createModerationParentAlert(
    accountId: string,
    userId: string,
    action: string,
    displayName: string | null
  ): Promise<void> {
    const name = displayName || 'votre enfant';
    const nameEn = displayName || 'your child';

    const messages: Record<string, { fr: string; en: string }> = {
      warned: {
        fr: `Un message de ${name} a été examiné par notre équipe de sécurité. Un avertissement a été émis.`,
        en: `A message from ${nameEn} was reviewed by our safety team. A warning was issued.`,
      },
      removed: {
        fr: `Un message de ${name} a été examiné et retiré par notre équipe de sécurité.`,
        en: `A message from ${nameEn} was reviewed and removed by our safety team.`,
      },
      suspended: {
        fr: `Le compte de ${name} a été suspendu par notre équipe de sécurité.`,
        en: `The account of ${nameEn} has been suspended by our safety team.`,
      },
    };

    const msg = messages[action];
    if (!msg) return;

    const severity = action === 'suspended' ? 'urgent' : 'warning';

    try {
      await this.parentDashboard.createAlertForManagedMember(
        accountId,
        userId,
        'moderation_action',
        severity,
        msg.fr,
        msg.en
      );
    } catch (error) {
      this.logger.error(`Failed to create parent alert: ${(error as Error).message}`);
    }
  }

  async getStats(): Promise<ModerationStatsResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, reviewing, resolvedToday, totalResolved, byPriority] = await Promise.all([
      this.prisma.moderationQueue.count({ where: { status: 'pending' } }),
      this.prisma.moderationQueue.count({ where: { status: 'reviewing' } }),
      this.prisma.moderationQueue.count({
        where: { status: 'resolved', resolvedAt: { gte: today } },
      }),
      this.prisma.moderationQueue.count({ where: { status: 'resolved' } }),
      Promise.all([
        this.prisma.moderationQueue.count({
          where: { status: 'pending', priority: 'low' },
        }),
        this.prisma.moderationQueue.count({
          where: { status: 'pending', priority: 'medium' },
        }),
        this.prisma.moderationQueue.count({
          where: { status: 'pending', priority: 'high' },
        }),
        this.prisma.moderationQueue.count({
          where: { status: 'pending', priority: 'urgent' },
        }),
      ]),
    ]);

    return {
      pending,
      reviewing,
      resolvedToday,
      totalResolved,
      byPriority: {
        low: byPriority[0],
        medium: byPriority[1],
        high: byPriority[2],
        urgent: byPriority[3],
      },
    };
  }

  /**
   * Lightweight related content for the queue list view.
   */
  private async getRelatedContent(itemType: string, itemId: string): Promise<any> {
    if (itemType === 'message') {
      const message = await this.prisma.message.findUnique({
        where: { id: itemId },
        include: {
          sender: { select: { id: true, displayName: true } },
          conversation: {
            select: { id: true, userAId: true, userBId: true },
          },
        },
      });
      return message
        ? {
            content: message.content,
            sender: message.sender,
            conversationId: message.conversation.id,
            sentAt: message.createdAt,
          }
        : null;
    }

    if (itemType === 'user') {
      const user = await this.prisma.user.findUnique({
        where: { id: itemId },
        include: {
          account: {
            select: { email: true, status: true, createdAt: true },
          },
        },
      });
      return user
        ? {
            displayName: user.displayName,
            email: user.account.email,
            accountStatus: user.account.status,
            memberSince: user.account.createdAt,
          }
        : null;
    }

    return null;
  }

  /**
   * Enriched related content for the single-item detail view.
   * Includes conversation context, reports, user profiles, and moderation history.
   */
  private async getRelatedContentDetailed(itemType: string, itemId: string): Promise<any> {
    if (itemType === 'message') {
      const message = await this.prisma.message.findUnique({
        where: { id: itemId },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              warningCount: true,
              account: { select: { accountType: true } },
            },
          },
          conversation: {
            select: {
              id: true,
              userA: {
                select: {
                  id: true,
                  displayName: true,
                  account: { select: { accountType: true } },
                },
              },
              userB: {
                select: {
                  id: true,
                  displayName: true,
                  account: { select: { accountType: true } },
                },
              },
            },
          },
        },
      });

      if (!message) return null;

      // Fetch surrounding messages (5 before + 5 after)
      const [messagesBefore, messagesAfter] = await Promise.all([
        this.prisma.message.findMany({
          where: {
            conversationId: message.conversationId,
            createdAt: { lt: message.createdAt },
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 5,
          include: { sender: { select: { displayName: true } } },
        }),
        this.prisma.message.findMany({
          where: {
            conversationId: message.conversationId,
            createdAt: { gt: message.createdAt },
          },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: 5,
          include: { sender: { select: { displayName: true } } },
        }),
      ]);

      // Fetch linked user reports
      const reports = await this.prisma.userReport.findMany({
        where: { reportedMessageId: itemId },
        include: { reporter: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Determine the other participant
      const conv = message.conversation;
      const otherParticipant = message.senderId === conv.userA.id ? conv.userB : conv.userA;

      return {
        content: message.content,
        sentAt: message.createdAt,
        sender: {
          id: message.sender.id,
          displayName: message.sender.displayName,
          accountType: message.sender.account.accountType,
          warningCount: message.sender.warningCount,
        },
        conversation: {
          id: message.conversationId,
          otherParticipant: {
            id: otherParticipant.id,
            displayName: otherParticipant.displayName,
            accountType: otherParticipant.account.accountType,
          },
        },
        surroundingMessages: [
          ...messagesBefore.reverse().map(m => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.sender.displayName,
            content: m.content,
            createdAt: m.createdAt,
            isFlagged: m.flagged,
          })),
          ...messagesAfter.map(m => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.sender.displayName,
            content: m.content,
            createdAt: m.createdAt,
            isFlagged: m.flagged,
          })),
        ],
        reports: reports.map(r => ({
          id: r.id,
          reporterName: r.reporter.displayName,
          reason: r.reason,
          description: r.description,
          createdAt: r.createdAt,
        })),
      };
    }

    if (itemType === 'user') {
      const user = await this.prisma.user.findUnique({
        where: { id: itemId },
        include: {
          account: {
            select: {
              email: true,
              accountType: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) return null;

      // Fetch reports against this user
      const reports = await this.prisma.userReport.findMany({
        where: { reportedUserId: itemId },
        include: { reporter: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Fetch past moderation queue items for this user
      const moderationHistory = await this.prisma.moderationQueue.findMany({
        where: {
          itemId,
          status: 'resolved',
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return {
        displayName: user.displayName,
        email: user.account.email,
        accountType: user.account.accountType,
        accountStatus: user.account.status,
        warningCount: user.warningCount,
        memberSince: user.account.createdAt,
        reports: reports.map(r => ({
          id: r.id,
          reporterName: r.reporter.displayName,
          reason: r.reason,
          description: r.description,
          createdAt: r.createdAt,
        })),
        moderationHistory: moderationHistory.map(h => ({
          id: h.id,
          itemType: h.itemType,
          actionTaken: h.actionTaken,
          flagReason: h.flagReason,
          createdAt: h.createdAt,
          resolvedAt: h.resolvedAt,
        })),
      };
    }

    return null;
  }
}
