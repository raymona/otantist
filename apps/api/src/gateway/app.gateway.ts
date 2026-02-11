import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { WsAuthMiddleware } from './ws-auth.middleware';
import { MessagingService } from '../messaging/messaging.service';
import { StateService } from '../state/state.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // accountId → Set<socketId> (multi-tab support)
  private connectedUsers = new Map<string, Set<string>>();
  // socketId → { accountId, userId }
  private socketMeta = new Map<string, { accountId: string; userId: string }>();

  constructor(
    private wsAuth: WsAuthMiddleware,
    private messagingService: MessagingService,
    private stateService: StateService
  ) {}

  async handleConnection(socket: Socket) {
    const authenticated = await this.wsAuth.authenticate(socket);
    if (!authenticated) return;

    const account = socket.data.account;
    const accountId = account.id;
    const userId = account.user?.id;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // Store socket metadata
    this.socketMeta.set(socket.id, { accountId, userId });

    // Track connected sockets per account
    if (!this.connectedUsers.has(accountId)) {
      this.connectedUsers.set(accountId, new Set());
    }
    this.connectedUsers.get(accountId)!.add(socket.id);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join all active conversation rooms
    try {
      const { conversations } = await this.messagingService.listConversations(accountId);
      for (const conv of conversations) {
        socket.join(`conversation:${conv.id}`);
      }
    } catch {
      // Non-critical: conversations will still work via personal room
    }

    // Update online status
    try {
      await this.stateService.updateOnlineStatus(accountId, true);
    } catch {
      // Non-critical
    }

    // Broadcast online to conversation partners
    this.broadcastPresence(userId, 'user:online', {});
  }

  async handleDisconnect(socket: Socket) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta) return;

    const { accountId, userId } = meta;
    this.socketMeta.delete(socket.id);

    // Remove socket from tracked set
    const sockets = this.connectedUsers.get(accountId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(accountId);

        // Last socket disconnected — go offline
        try {
          await this.stateService.updateOnlineStatus(accountId, false);
        } catch {
          // Non-critical
        }

        const lastSeen = new Date().toISOString();
        this.broadcastPresence(userId, 'user:offline', { lastSeen });
      }
    }
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    socket: Socket,
    payload: { conversationId: string; content: string; messageType?: string; tempId?: string }
  ) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta) return;

    try {
      const result = await this.messagingService.sendMessage(
        meta.accountId,
        payload.conversationId,
        {
          content: payload.content,
          messageType: (payload.messageType as any) || 'text',
        }
      );

      // Ensure sender is in the conversation room
      socket.join(`conversation:${payload.conversationId}`);

      // Emit to sender with tempId for dedup
      socket.emit('message:new', {
        conversationId: payload.conversationId,
        message: result.message,
        tempId: payload.tempId,
      });

      if (!result.queued) {
        // Get recipient userId from conversation
        const recipientUserId = await this.getRecipientUserId(
          meta.accountId,
          payload.conversationId
        );

        if (recipientUserId) {
          // Emit to recipient's personal room
          socket.to(`user:${recipientUserId}`).emit('message:new', {
            conversationId: payload.conversationId,
            message: { ...result.message, isOwnMessage: false },
          });

          // Check if recipient is online and mark as delivered
          const recipientAccountId = this.getAccountIdByUserId(recipientUserId);
          if (recipientAccountId && this.connectedUsers.has(recipientAccountId)) {
            try {
              await this.messagingService.markAsDelivered(result.message.id);
              const deliveredAt = new Date().toISOString();

              // Notify sender of delivery
              socket.emit('message:delivered', {
                conversationId: payload.conversationId,
                messageId: result.message.id,
                deliveredAt,
              });
            } catch {
              // Non-critical
            }
          }

          // Ensure recipient's sockets join the conversation room
          this.joinRoomForUser(recipientUserId, `conversation:${payload.conversationId}`);
        }
      }
    } catch (error: any) {
      socket.emit('error', {
        code: 'MESSAGE_SEND_FAILED',
        message_en: error.message || 'Failed to send message',
        message_fr: error.message || "Échec de l'envoi du message",
      });
    }
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(socket: Socket, payload: { conversationId: string; messageId: string }) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta) return;

    try {
      await this.messagingService.markAsRead(
        meta.accountId,
        payload.conversationId,
        payload.messageId
      );

      const readAt = new Date().toISOString();

      // Find the sender of the message and notify them
      const recipientUserId = await this.getRecipientUserId(meta.accountId, payload.conversationId);

      if (recipientUserId) {
        this.server.to(`user:${recipientUserId}`).emit('message:read_receipt', {
          conversationId: payload.conversationId,
          messageId: payload.messageId,
          readAt,
        });
      }
    } catch {
      // Non-critical: read receipts are best-effort
    }
  }

  @SubscribeMessage('message:typing')
  async handleTyping(socket: Socket, payload: { conversationId: string }) {
    const meta = this.socketMeta.get(socket.id);
    if (!meta) return;

    // Get display name from account
    const displayName = socket.data.account?.user?.displayName || 'User';

    // Broadcast to conversation room, excluding sender
    socket.to(`conversation:${payload.conversationId}`).emit('message:typing', {
      conversationId: payload.conversationId,
      userId: meta.userId,
      displayName,
    });
  }

  @OnEvent('user.state.changed')
  handleStateChanged(payload: {
    userId: string;
    socialEnergy?: string | null;
    calmModeActive?: boolean;
  }) {
    this.broadcastPresence(payload.userId, 'user:state_changed', {
      socialEnergy: payload.socialEnergy,
      calmModeActive: payload.calmModeActive,
    });
  }

  @OnEvent('conversation.unhidden')
  handleConversationUnhidden(payload: { conversationId: string; userId: string }) {
    // Notify the user whose conversation was unhidden (e.g. new message arrived)
    this.server.to(`user:${payload.userId}`).emit('conversation:unhidden', {
      conversationId: payload.conversationId,
    });
  }

  // --- Queued message delivery (called by MessageSchedulerService) ---

  deliverQueuedMessages(messagesPerRecipient: Map<string, any[]>) {
    for (const [recipientUserId, messages] of messagesPerRecipient) {
      for (const message of messages) {
        this.server.to(`user:${recipientUserId}`).emit('message:new', {
          conversationId: message.conversationId,
          message,
        });
      }

      // Ensure recipient joins conversation rooms for any new conversations
      for (const message of messages) {
        this.joinRoomForUser(recipientUserId, `conversation:${message.conversationId}`);
      }
    }
  }

  // --- Helpers ---

  private broadcastPresence(userId: string, event: string, data: Record<string, any>) {
    // Emit to all conversation rooms this user is part of
    // by sending to their personal room's "neighbors"
    this.server.to(`user:${userId}`).emit(event, { userId, ...data });

    // Also broadcast to all sockets that share a conversation room
    const rooms = this.server.sockets.adapter.rooms;
    for (const [roomName] of rooms) {
      if (!roomName.startsWith('conversation:')) continue;

      // Check if user is in this room
      const userRoom = `user:${userId}`;
      const userSockets = rooms.get(userRoom);
      if (!userSockets) continue;

      // Check if any of the user's sockets are in this conversation room
      const convRoom = rooms.get(roomName);
      if (!convRoom) continue;

      let userInRoom = false;
      for (const sid of userSockets) {
        if (convRoom.has(sid)) {
          userInRoom = true;
          break;
        }
      }

      if (userInRoom) {
        this.server.to(roomName).emit(event, { userId, ...data });
      }
    }
  }

  private async getRecipientUserId(
    senderAccountId: string,
    conversationId: string
  ): Promise<string | null> {
    try {
      const conv = await this.messagingService.getConversation(senderAccountId, conversationId);
      return conv.otherUser.id;
    } catch {
      return null;
    }
  }

  private getAccountIdByUserId(userId: string): string | null {
    for (const [, meta] of this.socketMeta) {
      if (meta.userId === userId) {
        return meta.accountId;
      }
    }
    return null;
  }

  private joinRoomForUser(userId: string, room: string) {
    const userRoom = this.server.sockets.adapter.rooms.get(`user:${userId}`);
    if (!userRoom) return;

    for (const socketId of userRoom) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(room);
      }
    }
  }
}
