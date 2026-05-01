import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { InviteRequestService } from './invite-request.service';
import { SubmitInviteRequestDto, ReviewInviteRequestDto, InviteRequestResponse } from './dto';

@ApiTags('invite-request')
@Controller('invite-request')
export class InviteRequestController {
  constructor(private inviteRequestService: InviteRequestService) {}

  // ── Public endpoint (no auth) ──────────────────────────

  @Post()
  @Throttle({ short: { limit: 3, ttl: 3600000 } }) // 3 per hour per IP
  @ApiOperation({ summary: 'Submit an invite request (public)' })
  @ApiResponse({ status: 201, description: 'Request submitted' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async submit(@Body() dto: SubmitInviteRequestDto): Promise<{ submitted: boolean }> {
    return this.inviteRequestService.submit(dto);
  }

  // ── Admin endpoints ────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List invite requests (admin)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  @ApiResponse({ status: 200, type: [InviteRequestResponse] })
  async list(@Query('status') status?: string): Promise<InviteRequestResponse[]> {
    return this.inviteRequestService.listRequests(status);
  }

  @Get('count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Count pending invite requests (admin)' })
  @ApiResponse({ status: 200 })
  async countPending(): Promise<{ count: number }> {
    const count = await this.inviteRequestService.countPending();
    return { count };
  }

  @Post('review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject an invite request (admin)' })
  @ApiResponse({ status: 201, type: InviteRequestResponse })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async review(@Body() dto: ReviewInviteRequestDto): Promise<InviteRequestResponse> {
    return this.inviteRequestService.review(dto);
  }
}
