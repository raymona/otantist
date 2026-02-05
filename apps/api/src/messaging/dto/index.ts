import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';

// ============================================
// Enums
// ============================================

export enum MessageType {
  TEXT = 'text',
  EMOJI = 'emoji',
  SYSTEM = 'system',
}

export enum MessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  ARCHIVED = 'archived',
}

// ============================================
// Conversation DTOs
// ============================================

export class StartConversationDto {
  @ApiProperty({ description: 'User ID to start conversation with' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Optional first message' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}

export class ConversationResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  otherUser!: {
    id: string;
    displayName: string | null;
    isOnline: boolean;
    lastSeen: Date | null;
    socialEnergy: string | null;
    calmModeActive: boolean;
  };

  @ApiPropertyOptional()
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
    status: string;
  } | null;

  @ApiProperty()
  unreadCount!: number;
}

export class ConversationListResponse {
  @ApiProperty({ type: [ConversationResponse] })
  conversations!: ConversationResponse[];

  @ApiProperty()
  total!: number;
}

// ============================================
// Message DTOs
// ============================================

export class SendMessageDto {
  @ApiProperty({ example: 'Hello!', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  content!: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}

export class MessageResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty()
  senderId!: string;

  @ApiProperty()
  messageType!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  status!: string;

  @ApiPropertyOptional()
  queuedReason?: string | null;

  @ApiPropertyOptional()
  deliverAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  deliveredAt?: Date | null;

  @ApiPropertyOptional()
  readAt?: Date | null;

  @ApiProperty()
  isOwnMessage!: boolean;
}

export class MessageListResponse {
  @ApiProperty({ type: [MessageResponse] })
  messages!: MessageResponse[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  hasMore!: boolean;
}

export class GetMessagesQueryDto {
  @ApiPropertyOptional({ default: 50, description: 'Number of messages to return' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Cursor for pagination (message ID)' })
  @IsOptional()
  @IsUUID()
  before?: string;
}

// ============================================
// Message Actions
// ============================================

export class MarkReadDto {
  @ApiProperty({ description: 'Last message ID that was read' })
  @IsUUID()
  messageId!: string;
}

export class MessageQueuedResponse {
  @ApiProperty()
  queued!: boolean;

  @ApiProperty()
  reason!: string;

  @ApiPropertyOptional()
  deliverAt?: Date;

  @ApiProperty()
  message!: MessageResponse;
}
