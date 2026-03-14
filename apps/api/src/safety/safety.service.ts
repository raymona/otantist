import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitReportDto, BlockedUserResponse, ReportResponse } from './dto';

@Injectable()
export class SafetyService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  private async getUserId(accountId: string): Promise<string> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true },
    });

    if (!account?.user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message_en: 'User not found',
        message_fr: 'Utilisateur introuvable',
      });
    }

    return account.user.id;
  }

  // ============================================
  // Blocking
  // ============================================

  async listBlockedUsers(accountId: string): Promise<BlockedUserResponse[]> {
    const userId = await this.getUserId(accountId);

    const blocks = await this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      include: {
        blocked: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map(block => ({
      id: block.blocked.id,
      displayName: block.blocked.displayName,
      blockedAt: block.createdAt,
    }));
  }

  async blockUser(accountId: string, targetUserId: string): Promise<BlockedUserResponse> {
    const userId = await this.getUserId(accountId);

    if (userId === targetUserId) {
      throw new BadRequestException({
        code: 'CANNOT_BLOCK_SELF',
        message_en: 'Cannot block yourself',
        message_fr: 'Impossible de vous bloquer vous-même',
      });
    }

    // Check target exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message_en: 'User not found',
        message_fr: 'Utilisateur introuvable',
      });
    }

    // Check if already blocked
    const existing = await this.prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException({
        code: 'USER_ALREADY_BLOCKED',
        message_en: 'User is already blocked',
        message_fr: "L'utilisateur est déjà bloqué",
      });
    }

    // Create block and update any active conversations
    await this.prisma.$transaction(async tx => {
      await tx.blockedUser.create({
        data: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      });

      // Archive conversations between these users
      await tx.conversation.updateMany({
        where: {
          OR: [
            { userAId: userId, userBId: targetUserId },
            { userAId: targetUserId, userBId: userId },
          ],
          status: 'active',
        },
        data: { status: 'blocked' },
      });
    });

    return {
      id: targetUser.id,
      displayName: targetUser.displayName,
      blockedAt: new Date(),
    };
  }

  async unblockUser(accountId: string, targetUserId: string): Promise<void> {
    const userId = await this.getUserId(accountId);

    const block = await this.prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      },
    });

    if (!block) {
      throw new NotFoundException({
        code: 'USER_NOT_BLOCKED',
        message_en: 'User is not blocked',
        message_fr: "L'utilisateur n'est pas bloqué",
      });
    }

    await this.prisma.$transaction(async tx => {
      await tx.blockedUser.delete({
        where: { id: block.id },
      });

      // Reactivate conversations (only if neither side still has a block)
      const reverseBlock = await tx.blockedUser.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: targetUserId,
            blockedId: userId,
          },
        },
      });

      if (!reverseBlock) {
        await tx.conversation.updateMany({
          where: {
            OR: [
              { userAId: userId, userBId: targetUserId },
              { userAId: targetUserId, userBId: userId },
            ],
            status: 'blocked',
          },
          data: { status: 'active' },
        });
      }
    });
  }

  // ============================================
  // Reporting
  // ============================================

  async submitReport(accountId: string, dto: SubmitReportDto): Promise<ReportResponse> {
    const userId = await this.getUserId(accountId);

    if (!dto.reportedUserId && !dto.reportedMessageId) {
      throw new BadRequestException({
        code: 'REPORT_TARGET_REQUIRED',
        message_en: 'Must provide either reportedUserId or reportedMessageId',
        message_fr: "Vous devez fournir un identifiant d'utilisateur ou de message à signaler",
      });
    }

    // Validate reported user exists
    if (dto.reportedUserId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: dto.reportedUserId },
      });
      if (!targetUser) {
        throw new NotFoundException({
          code: 'REPORTED_USER_NOT_FOUND',
          message_en: 'Reported user not found',
          message_fr: 'Utilisateur signalé introuvable',
        });
      }
      if (dto.reportedUserId === userId) {
        throw new BadRequestException({
          code: 'CANNOT_REPORT_SELF',
          message_en: 'Cannot report yourself',
          message_fr: 'Impossible de vous signaler vous-même',
        });
      }
    }

    // Validate reported message exists
    if (dto.reportedMessageId) {
      const message = await this.prisma.message.findUnique({
        where: { id: dto.reportedMessageId },
        include: { conversation: true },
      });
      if (!message) {
        throw new NotFoundException({
          code: 'REPORTED_MESSAGE_NOT_FOUND',
          message_en: 'Reported message not found',
          message_fr: 'Message signalé introuvable',
        });
      }

      // Flag the message
      await this.prisma.message.update({
        where: { id: dto.reportedMessageId },
        data: {
          flagged: true,
          flaggedBy: 'user',
          flaggedReason: dto.reason,
        },
      });
    }

    // Create report
    const report = await this.prisma.userReport.create({
      data: {
        reporterId: userId,
        reportedUserId: dto.reportedUserId,
        reportedMessageId: dto.reportedMessageId,
        reason: dto.reason,
        description: dto.description,
      },
    });

    // Add to moderation queue
    await this.prisma.moderationQueue.create({
      data: {
        itemType: dto.reportedMessageId ? 'message' : 'user',
        itemId: dto.reportedMessageId || dto.reportedUserId!,
        flaggedBy: 'user',
        flagReason: `${dto.reason}${dto.description ? ': ' + dto.description : ''}`,
        priority: dto.reason === 'safety_concern' ? 'high' : 'medium',
      },
    });

    // Notify moderators of new queue item
    this.eventEmitter.emit('moderation.new_item', {
      itemType: dto.reportedMessageId ? 'message' : 'user',
      priority: dto.reason === 'safety_concern' ? 'high' : 'medium',
    });

    return {
      id: report.id,
      reason: report.reason,
      description: report.description,
      createdAt: report.createdAt,
    };
  }
}
