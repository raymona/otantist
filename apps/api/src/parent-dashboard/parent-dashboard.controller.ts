import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { ParentDashboardService } from './parent-dashboard.service';
import {
  ManagedMemberResponse,
  MemberIndicatorResponse,
  ParentAlertResponse,
} from './dto';

@ApiTags('parent')
@Controller('parent')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ParentDashboardController {
  constructor(private parentDashboardService: ParentDashboardService) {}

  @Get('members')
  @ApiOperation({ summary: 'List managed members' })
  @ApiResponse({ status: 200, type: [ManagedMemberResponse] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMembers(
    @Request() req: any,
  ): Promise<ManagedMemberResponse[]> {
    return this.parentDashboardService.getManagedMembers(req.user.id);
  }

  @Get('members/:id/indicators')
  @ApiOperation({ summary: 'Get member activity indicators (last 30 days)' })
  @ApiParam({ name: 'id', description: 'Member user ID' })
  @ApiResponse({ status: 200, type: [MemberIndicatorResponse] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not authorized to access this member' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getMemberIndicators(
    @Request() req: any,
    @Param('id') memberUserId: string,
  ): Promise<MemberIndicatorResponse[]> {
    return this.parentDashboardService.getMemberIndicators(
      req.user.id,
      memberUserId,
    );
  }

  @Get('members/:id/alerts')
  @ApiOperation({ summary: 'Get alerts for a managed member' })
  @ApiParam({ name: 'id', description: 'Member user ID' })
  @ApiResponse({ status: 200, type: [ParentAlertResponse] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not authorized to access this member' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async getMemberAlerts(
    @Request() req: any,
    @Param('id') memberUserId: string,
  ): Promise<ParentAlertResponse[]> {
    return this.parentDashboardService.getMemberAlerts(
      req.user.id,
      memberUserId,
    );
  }

  @Patch('members/:id/alerts/:alertId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiParam({ name: 'id', description: 'Member user ID' })
  @ApiParam({ name: 'alertId', description: 'Alert ID' })
  @ApiResponse({ status: 200, type: ParentAlertResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not authorized to access this alert' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async acknowledgeAlert(
    @Request() req: any,
    @Param('id') memberUserId: string,
    @Param('alertId') alertId: string,
  ): Promise<ParentAlertResponse> {
    return this.parentDashboardService.acknowledgeAlert(
      req.user.id,
      memberUserId,
      alertId,
    );
  }
}
