import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ResolveQueueItemDto,
  ModerationQueueItemResponse,
  ModerationStatsResponse,
} from './dto';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async getQueue(
    status?: string,
    priority?: string,
  ): Promise<ModerationQueueItemResponse[]> {
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const items = await this.prisma.moderationQueue.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return Promise.all(
      items.map(async (item) => {
        const relatedContent = await this.getRelatedContent(
          item.itemType,
          item.itemId,
        );

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
          createdAt: item.createdAt,
          resolvedAt: item.resolvedAt,
          relatedContent,
        };
      }),
    );
  }

  async getQueueItem(id: string): Promise<ModerationQueueItemResponse> {
    const item = await this.prisma.moderationQueue.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Queue item not found');
    }

    const relatedContent = await this.getRelatedContent(
      item.itemType,
      item.itemId,
    );

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
      createdAt: item.createdAt,
      resolvedAt: item.resolvedAt,
      relatedContent,
    };
  }

  async resolveQueueItem(
    id: string,
    reviewerAccountId: string,
    dto: ResolveQueueItemDto,
  ): Promise<ModerationQueueItemResponse> {
    const item = await this.prisma.moderationQueue.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Queue item not found');
    }

    // Apply action
    if (dto.action === 'removed' && item.itemType === 'message') {
      await this.prisma.message.update({
        where: { id: item.itemId },
        data: {
          content: '[Removed by moderator]',
          messageType: 'system',
        },
      });
    }

    if (dto.action === 'suspended' && item.itemType === 'user') {
      await this.prisma.account.update({
        where: {
          id: (
            await this.prisma.user.findUnique({
              where: { id: item.itemId },
            })
          )?.accountId,
        },
        data: { status: 'suspended' },
      });
    }

    // Update queue item
    await this.prisma.moderationQueue.update({
      where: { id },
      data: {
        status: 'resolved',
        actionTaken: dto.action,
        resolutionNotes: dto.notes,
        reviewedById: reviewerAccountId,
        resolvedAt: new Date(),
      },
    });

    return this.getQueueItem(id);
  }

  async getStats(): Promise<ModerationStatsResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, reviewing, resolvedToday, totalResolved, byPriority] =
      await Promise.all([
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

  private async getRelatedContent(
    itemType: string,
    itemId: string,
  ): Promise<any> {
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
}
