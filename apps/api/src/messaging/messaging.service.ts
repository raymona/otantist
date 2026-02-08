import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MessageType,
  ConversationResponse,
  ConversationListResponse,
  SendMessageDto,
  MessageResponse,
  MessageListResponse,
} from './dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  private async getUserIdFromAccount(accountId: string): Promise<string> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true },
    });

    if (!account?.user) {
      throw new NotFoundException('User not found');
    }

    return account.user.id;
  }

  // ============================================
  // Conversations
  // ============================================

  async listConversations(accountId: string): Promise<ConversationListResponse> {
    const userId = await this.getUserIdFromAccount(accountId);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
        status: 'active',
      },
      include: {
        userA: {
          include: { state: true },
        },
        userB: {
          include: { state: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const conversationResponses: ConversationResponse[] = await Promise.all(
      conversations.map(async conv => {
        const otherUser = conv.userAId === userId ? conv.userB : conv.userA;
        const lastMessage = conv.messages[0] || null;

        // Count unread messages
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            readAt: null,
            status: { not: 'queued' },
          },
        });

        return {
          id: conv.id,
          status: conv.status,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          otherUser: {
            id: otherUser.id,
            displayName: otherUser.displayName,
            isOnline: otherUser.state?.isOnline ?? false,
            lastSeen: otherUser.state?.lastSeen ?? null,
            socialEnergy: otherUser.state?.socialEnergy ?? null,
            calmModeActive: otherUser.state?.calmModeActive ?? false,
          },
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
                status: lastMessage.status,
              }
            : null,
          unreadCount,
        };
      })
    );

    return {
      conversations: conversationResponses,
      total: conversationResponses.length,
    };
  }

  async startConversation(
    accountId: string,
    otherUserId: string,
    initialMessage?: string
  ): Promise<ConversationResponse> {
    const userId = await this.getUserIdFromAccount(accountId);

    if (userId === otherUserId) {
      throw new BadRequestException('Cannot start conversation with yourself');
    }

    // Check if other user exists
    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      include: { state: true, account: true },
    });

    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    // Check if blocked
    const isBlocked = await this.isBlocked(userId, otherUserId);
    if (isBlocked) {
      throw new ForbiddenException('Cannot message this user');
    }

    // Check if conversation already exists
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: otherUserId },
          { userAId: otherUserId, userBId: userId },
        ],
      },
    });

    if (conversation) {
      // Reactivate if archived
      if (conversation.status === 'archived') {
        conversation = await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { status: 'active' },
        });
      }
    } else {
      // Create new conversation
      conversation = await this.prisma.conversation.create({
        data: {
          userAId: userId,
          userBId: otherUserId,
        },
      });
    }

    // Send initial message if provided
    if (initialMessage) {
      await this.sendMessage(accountId, conversation.id, {
        content: initialMessage,
        messageType: MessageType.TEXT,
      });
    }

    return this.getConversation(accountId, conversation.id);
  }

  async getConversation(accountId: string, conversationId: string): Promise<ConversationResponse> {
    const userId = await this.getUserIdFromAccount(accountId);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        userA: { include: { state: true } },
        userB: { include: { state: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check user is part of conversation
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const otherUser = conversation.userAId === userId ? conversation.userB : conversation.userA;
    const lastMessage = conversation.messages[0] || null;

    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId: conversation.id,
        senderId: { not: userId },
        readAt: null,
        status: { not: 'queued' },
      },
    });

    return {
      id: conversation.id,
      status: conversation.status,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      otherUser: {
        id: otherUser.id,
        displayName: otherUser.displayName,
        isOnline: otherUser.state?.isOnline ?? false,
        lastSeen: otherUser.state?.lastSeen ?? null,
        socialEnergy: otherUser.state?.socialEnergy ?? null,
        calmModeActive: otherUser.state?.calmModeActive ?? false,
      },
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
            status: lastMessage.status,
          }
        : null,
      unreadCount,
    };
  }

  // ============================================
  // Messages
  // ============================================

  async getMessages(
    accountId: string,
    conversationId: string,
    limit: number = 50,
    before?: string
  ): Promise<MessageListResponse> {
    const userId = await this.getUserIdFromAccount(accountId);

    // Verify access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Build query
    const whereClause: any = {
      conversationId,
      // Don't show queued messages from other user
      OR: [{ senderId: userId }, { senderId: { not: userId }, status: { not: 'queued' } }],
    };

    if (before) {
      const beforeMessage = await this.prisma.message.findUnique({
        where: { id: before },
      });
      if (beforeMessage) {
        whereClause.createdAt = { lt: beforeMessage.createdAt };
      }
    }

    const messages = await this.prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Get one extra to check if there are more
    });

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    const total = await this.prisma.message.count({
      where: { conversationId },
    });

    return {
      messages: messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        messageType: msg.messageType,
        content: msg.content,
        status: msg.status,
        queuedReason: msg.queuedReason,
        deliverAt: msg.deliverAt,
        createdAt: msg.createdAt,
        deliveredAt: msg.deliveredAt,
        readAt: msg.readAt,
        isOwnMessage: msg.senderId === userId,
      })),
      total,
      hasMore,
    };
  }

  async sendMessage(
    accountId: string,
    conversationId: string,
    dto: SendMessageDto
  ): Promise<{ queued: boolean; reason?: string; deliverAt?: Date; message: MessageResponse }> {
    const userId = await this.getUserIdFromAccount(accountId);

    // Verify conversation and access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        userA: { include: { state: true, account: true, timeBoundaries: true } },
        userB: { include: { state: true, account: true, timeBoundaries: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (conversation.status === 'blocked') {
      throw new ForbiddenException('Conversation is blocked');
    }

    const recipient = conversation.userAId === userId ? conversation.userB : conversation.userA;

    // Check if blocked
    const isBlocked = await this.isBlocked(userId, recipient.id);
    if (isBlocked) {
      throw new ForbiddenException('Cannot message this user');
    }

    // Check delivery conditions
    const deliveryCheck = await this.checkDeliveryConditions(recipient);

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        messageType: dto.messageType || 'text',
        content: dto.content,
        status: deliveryCheck.queued ? 'queued' : 'sent',
        queuedReason: deliveryCheck.reason || null,
        deliverAt: deliveryCheck.deliverAt || null,
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Update member indicators for sender
    await this.updateMessageIndicators(userId, 'sent');

    const messageResponse: MessageResponse = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      messageType: message.messageType,
      content: message.content,
      status: message.status,
      queuedReason: message.queuedReason,
      deliverAt: message.deliverAt,
      createdAt: message.createdAt,
      deliveredAt: message.deliveredAt,
      readAt: message.readAt,
      isOwnMessage: true,
    };

    return {
      queued: deliveryCheck.queued,
      reason: deliveryCheck.reason,
      deliverAt: deliveryCheck.deliverAt,
      message: messageResponse,
    };
  }

  async markAsDelivered(messageId: string): Promise<void> {
    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        status: 'delivered',
        deliveredAt: new Date(),
      },
    });
  }

  async deleteMessage(accountId: string, messageId: string): Promise<void> {
    const userId = await this.getUserIdFromAccount(accountId);

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can delete their own messages
    if (message.senderId !== userId) {
      throw new ForbiddenException('Cannot delete this message');
    }

    // Soft delete by clearing content
    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: '[Message deleted]',
        messageType: 'system',
      },
    });
  }

  async markAsRead(accountId: string, conversationId: string, messageId: string): Promise<void> {
    const userId = await this.getUserIdFromAccount(accountId);

    // Verify access
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Mark all messages up to and including messageId as read
    const targetMessage = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!targetMessage || targetMessage.conversationId !== conversationId) {
      throw new NotFoundException('Message not found');
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
        createdAt: { lte: targetMessage.createdAt },
      },
      data: {
        readAt: new Date(),
        status: 'read',
      },
    });

    // Update member indicators for recipient
    const otherUserId =
      conversation.userAId === userId ? conversation.userBId : conversation.userAId;
    await this.updateMessageIndicators(otherUserId, 'received');
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async isBlocked(userId: string, otherUserId: string): Promise<boolean> {
    const block = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });

    return !!block;
  }

  private async checkDeliveryConditions(recipient: any): Promise<{
    queued: boolean;
    reason?: string;
    deliverAt?: Date;
  }> {
    // Check calm mode
    if (recipient.state?.calmModeActive) {
      return {
        queued: true,
        reason: 'recipient_calm_mode',
      };
    }

    // Check time boundaries
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const boundaries = recipient.timeBoundaries || [];
    const todayBoundary = boundaries.find((b: any) => b.dayOfWeek === dayOfWeek);

    if (todayBoundary) {
      const { availableStart, availableEnd } = todayBoundary;

      if (currentTime < availableStart || currentTime > availableEnd) {
        // Calculate next available time
        let deliverAt: Date;

        if (currentTime < availableStart) {
          // Deliver later today
          deliverAt = new Date();
          const [hours, minutes] = availableStart.split(':').map(Number);
          deliverAt.setHours(hours, minutes, 0, 0);
        } else {
          // Deliver tomorrow or next available day
          deliverAt = this.findNextAvailableTime(boundaries, now);
        }

        return {
          queued: true,
          reason: 'outside_time_boundary',
          deliverAt,
        };
      }
    }

    return { queued: false };
  }

  private findNextAvailableTime(boundaries: any[], from: Date): Date {
    const result = new Date(from);

    for (let i = 1; i <= 7; i++) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      const boundary = boundaries.find((b: any) => b.dayOfWeek === dayOfWeek);

      if (boundary) {
        const [hours, minutes] = boundary.availableStart.split(':').map(Number);
        result.setHours(hours, minutes, 0, 0);
        return result;
      }
    }

    // No boundaries set, deliver tomorrow morning
    result.setDate(from.getDate() + 1);
    result.setHours(9, 0, 0, 0);
    return result;
  }

  private async updateMessageIndicators(userId: string, type: 'sent' | 'received'): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updateData =
      type === 'sent' ? { messagesSent: { increment: 1 } } : { messagesReceived: { increment: 1 } };

    await this.prisma.memberIndicator.upsert({
      where: {
        userId_recordedAt: {
          userId,
          recordedAt: today,
        },
      },
      create: {
        userId,
        recordedAt: today,
        messagesSent: type === 'sent' ? 1 : 0,
        messagesReceived: type === 'received' ? 1 : 0,
      },
      update: updateData,
    });
  }
}
