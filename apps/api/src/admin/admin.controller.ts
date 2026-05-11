import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { AdminService } from './admin.service';
import { SetRoleDto, AdminUserResponse, CreateInviteCodeDto, InviteCodeResponse } from './dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by email or display name' })
  @ApiResponse({ status: 200, type: [AdminUserResponse] })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async listUsers(@Query('search') search?: string): Promise<AdminUserResponse[]> {
    return this.adminService.listUsers(search);
  }

  @Patch('users/set-role')
  @ApiOperation({ summary: 'Change user role (admin)' })
  @ApiResponse({ status: 200, type: AdminUserResponse })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async setRole(@Body() dto: SetRoleDto): Promise<AdminUserResponse> {
    return this.adminService.setRole(dto);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user account and all associated data (admin)' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete self' })
  @ApiResponse({ status: 403, description: 'Cannot delete super admin' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async deleteUser(@Param('id') id: string, @Req() req: any): Promise<{ deleted: true }> {
    await this.adminService.deleteUser(id, req.user.accountId);
    return { deleted: true };
  }

  @Get('invite-codes')
  @ApiOperation({ summary: 'List all invite codes (admin)' })
  @ApiResponse({ status: 200, type: [InviteCodeResponse] })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async listInviteCodes(): Promise<InviteCodeResponse[]> {
    return this.adminService.listInviteCodes();
  }

  @Post('invite-codes')
  @ApiOperation({ summary: 'Create a new invite code (admin)' })
  @ApiResponse({ status: 201, type: InviteCodeResponse })
  @ApiResponse({ status: 400, description: 'Code already exists' })
  @ApiResponse({ status: 403, description: 'Insufficient role' })
  async createInviteCode(@Body() dto: CreateInviteCodeDto): Promise<InviteCodeResponse> {
    return this.adminService.createInviteCode(dto);
  }
}
