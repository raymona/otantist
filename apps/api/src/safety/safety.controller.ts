import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { SafetyService } from './safety.service';
import { SubmitReportDto, BlockedUserResponse, ReportResponse } from './dto';

@ApiTags('safety')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SafetyController {
  constructor(private safetyService: SafetyService) {}

  // ============================================
  // Blocked Users
  // ============================================

  @Get('blocked-users')
  @ApiOperation({ summary: 'List blocked users' })
  @ApiResponse({ status: 200, type: [BlockedUserResponse] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listBlockedUsers(@Request() req: any): Promise<BlockedUserResponse[]> {
    return this.safetyService.listBlockedUsers(req.user.id);
  }

  @Post('blocked-users/:userId')
  @ApiOperation({ summary: 'Block a user' })
  @ApiParam({ name: 'userId', description: 'User ID to block' })
  @ApiResponse({ status: 201, type: BlockedUserResponse })
  @ApiResponse({ status: 400, description: 'Cannot block yourself or already blocked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async blockUser(
    @Request() req: any,
    @Param('userId') userId: string,
  ): Promise<BlockedUserResponse> {
    return this.safetyService.blockUser(req.user.id, userId);
  }

  @Delete('blocked-users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unblock a user' })
  @ApiParam({ name: 'userId', description: 'User ID to unblock' })
  @ApiResponse({ status: 204, description: 'User unblocked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not blocked' })
  async unblockUser(
    @Request() req: any,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.safetyService.unblockUser(req.user.id, userId);
  }

  // ============================================
  // Reports
  // ============================================

  @Post('reports')
  @ApiOperation({ summary: 'Submit a report' })
  @ApiResponse({ status: 201, type: ReportResponse })
  @ApiResponse({ status: 400, description: 'Invalid report' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Reported user or message not found' })
  async submitReport(
    @Request() req: any,
    @Body() dto: SubmitReportDto,
  ): Promise<ReportResponse> {
    return this.safetyService.submitReport(req.user.id, dto);
  }
}
