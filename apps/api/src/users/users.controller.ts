import { Controller, Get, Patch, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  UpdateLanguageDto,
  UserProfileResponse,
  OnboardingStatusResponse,
  HowToTalkToMeResponse,
  UserDirectoryResponse,
} from './dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved', type: UserProfileResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req: any): Promise<UserProfileResponse> {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: UserProfileResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Request() req: any,
    @Body() dto: UpdateProfileDto
  ): Promise<UserProfileResponse> {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get('directory')
  @ApiOperation({ summary: 'Get user directory (searchable list of onboarded users)' })
  @ApiResponse({ status: 200, description: 'User directory', type: UserDirectoryResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDirectory(
    @Request() req: any,
    @Query('search') search?: string
  ): Promise<UserDirectoryResponse> {
    return this.usersService.getDirectory(req.user.id, search);
  }

  @Get('me/onboarding-status')
  @ApiOperation({ summary: 'Get onboarding progress' })
  @ApiResponse({ status: 200, description: 'Onboarding status', type: OnboardingStatusResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOnboardingStatus(@Request() req: any): Promise<OnboardingStatusResponse> {
    return this.usersService.getOnboardingStatus(req.user.id);
  }

  @Patch('me/language')
  @ApiOperation({ summary: 'Change language preference' })
  @ApiResponse({ status: 200, description: 'Language updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateLanguage(
    @Request() req: any,
    @Body() dto: UpdateLanguageDto
  ): Promise<{ language: string }> {
    return this.usersService.updateLanguage(req.user.id, dto.language);
  }

  @Get(':id/how-to-talk-to-me')
  @ApiOperation({ summary: "Get another user's communication guide" })
  @ApiResponse({ status: 200, description: 'Communication guide', type: HowToTalkToMeResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Profile hidden or blocked' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getHowToTalkToMe(
    @Request() req: any,
    @Param('id') userId: string
  ): Promise<HowToTalkToMeResponse> {
    return this.usersService.getHowToTalkToMe(req.user.id, userId);
  }
}
