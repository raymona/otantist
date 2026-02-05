import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
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
import { ModerationService } from './moderation.service';
import {
  ResolveQueueItemDto,
  ModerationQueueItemResponse,
  ModerationStatsResponse,
} from './dto';

@ApiTags('moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get moderation queue' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'reviewing', 'resolved'] })
  @ApiQuery({ name: 'priority', required: false, enum: ['low', 'medium', 'high', 'urgent'] })
  @ApiResponse({ status: 200, type: [ModerationQueueItemResponse] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueue(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ): Promise<ModerationQueueItemResponse[]> {
    return this.moderationService.getQueue(status, priority);
  }

  @Get('queue/:id')
  @ApiOperation({ summary: 'Get queue item details' })
  @ApiParam({ name: 'id', description: 'Queue item ID' })
  @ApiResponse({ status: 200, type: ModerationQueueItemResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getQueueItem(
    @Param('id') id: string,
  ): Promise<ModerationQueueItemResponse> {
    return this.moderationService.getQueueItem(id);
  }

  @Patch('queue/:id/resolve')
  @ApiOperation({ summary: 'Resolve a moderation queue item' })
  @ApiParam({ name: 'id', description: 'Queue item ID' })
  @ApiResponse({ status: 200, type: ModerationQueueItemResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async resolveQueueItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ResolveQueueItemDto,
  ): Promise<ModerationQueueItemResponse> {
    return this.moderationService.resolveQueueItem(id, req.user.id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get moderation statistics' })
  @ApiResponse({ status: 200, type: ModerationStatsResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(): Promise<ModerationStatsResponse> {
    return this.moderationService.getStats();
  }
}
