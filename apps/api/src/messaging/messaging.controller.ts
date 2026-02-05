import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { MessagingService } from './messaging.service';
import {
  StartConversationDto,
  ConversationResponse,
  ConversationListResponse,
  SendMessageDto,
  MessageListResponse,
  MarkReadDto,
} from './dto';

@ApiTags('messaging')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  // ============================================
  // Conversations
  // ============================================

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations' })
  @ApiResponse({ status: 200, type: ConversationListResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listConversations(@Request() req: any): Promise<ConversationListResponse> {
    return this.messagingService.listConversations(req.user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Start a new conversation' })
  @ApiResponse({ status: 201, type: ConversationResponse })
  @ApiResponse({ status: 400, description: 'Cannot start conversation with yourself' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot message this user (blocked)' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async startConversation(
    @Request() req: any,
    @Body() dto: StartConversationDto,
  ): Promise<ConversationResponse> {
    return this.messagingService.startConversation(
      req.user.id,
      dto.userId,
      dto.message,
    );
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, type: ConversationResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @Request() req: any,
    @Param('id') conversationId: string,
  ): Promise<ConversationResponse> {
    return this.messagingService.getConversation(req.user.id, conversationId);
  }

  // ============================================
  // Messages
  // ============================================

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation (paginated)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of messages (default 50, max 100)' })
  @ApiQuery({ name: 'before', required: false, description: 'Get messages before this message ID' })
  @ApiResponse({ status: 200, type: MessageListResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getMessages(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ): Promise<MessageListResponse> {
    return this.messagingService.getMessages(
      req.user.id,
      conversationId,
      limit || 50,
      before,
    );
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 201, description: 'Message sent or queued' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied or blocked' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async sendMessage(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagingService.sendMessage(req.user.id, conversationId, dto);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Conversation or message not found' })
  async markAsRead(
    @Request() req: any,
    @Param('id') conversationId: string,
    @Body() dto: MarkReadDto,
  ): Promise<void> {
    return this.messagingService.markAsRead(
      req.user.id,
      conversationId,
      dto.messageId,
    );
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message (soft delete)' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 204, description: 'Message deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot delete this message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Request() req: any,
    @Param('id') messageId: string,
  ): Promise<void> {
    return this.messagingService.deleteMessage(req.user.id, messageId);
  }
}
