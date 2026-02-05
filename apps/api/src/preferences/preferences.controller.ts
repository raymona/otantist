import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { PreferencesService } from './preferences.service';
import {
  UpdateCommunicationPrefsDto,
  CommunicationPrefsResponse,
  UpdateSensoryPrefsDto,
  SensoryPrefsResponse,
  UpdateTimeBoundariesDto,
  TimeBoundaryResponse,
  UpdateConversationStartersDto,
  ConversationStartersResponse,
} from './dto';

@ApiTags('preferences')
@Controller('preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PreferencesController {
  constructor(private preferencesService: PreferencesService) {}

  // ============================================
  // Communication Preferences
  // ============================================

  @Get('communication')
  @ApiOperation({ summary: 'Get communication preferences' })
  @ApiResponse({ status: 200, type: CommunicationPrefsResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCommunicationPrefs(@Request() req: any): Promise<CommunicationPrefsResponse> {
    return this.preferencesService.getCommunicationPrefs(req.user.id);
  }

  @Patch('communication')
  @ApiOperation({ summary: 'Update communication preferences (partial save OK)' })
  @ApiResponse({ status: 200, type: CommunicationPrefsResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCommunicationPrefs(
    @Request() req: any,
    @Body() dto: UpdateCommunicationPrefsDto,
  ): Promise<CommunicationPrefsResponse> {
    return this.preferencesService.updateCommunicationPrefs(req.user.id, dto);
  }

  // ============================================
  // Sensory Preferences
  // ============================================

  @Get('sensory')
  @ApiOperation({ summary: 'Get sensory preferences' })
  @ApiResponse({ status: 200, type: SensoryPrefsResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSensoryPrefs(@Request() req: any): Promise<SensoryPrefsResponse> {
    return this.preferencesService.getSensoryPrefs(req.user.id);
  }

  @Patch('sensory')
  @ApiOperation({ summary: 'Update sensory preferences (partial save OK)' })
  @ApiResponse({ status: 200, type: SensoryPrefsResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSensoryPrefs(
    @Request() req: any,
    @Body() dto: UpdateSensoryPrefsDto,
  ): Promise<SensoryPrefsResponse> {
    return this.preferencesService.updateSensoryPrefs(req.user.id, dto);
  }

  // ============================================
  // Time Boundaries
  // ============================================

  @Get('time-boundaries')
  @ApiOperation({ summary: 'Get time boundaries' })
  @ApiResponse({ status: 200, type: [TimeBoundaryResponse] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTimeBoundaries(@Request() req: any): Promise<TimeBoundaryResponse[]> {
    return this.preferencesService.getTimeBoundaries(req.user.id);
  }

  @Put('time-boundaries')
  @ApiOperation({ summary: 'Replace all time boundaries' })
  @ApiResponse({ status: 200, type: [TimeBoundaryResponse] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTimeBoundaries(
    @Request() req: any,
    @Body() dto: UpdateTimeBoundariesDto,
  ): Promise<TimeBoundaryResponse[]> {
    return this.preferencesService.updateTimeBoundaries(req.user.id, dto);
  }

  // ============================================
  // Conversation Starters
  // ============================================

  @Get('conversation-starters')
  @ApiOperation({ summary: 'Get conversation starters ("How to Talk to Me")' })
  @ApiResponse({ status: 200, type: ConversationStartersResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getConversationStarters(@Request() req: any): Promise<ConversationStartersResponse> {
    return this.preferencesService.getConversationStarters(req.user.id);
  }

  @Patch('conversation-starters')
  @ApiOperation({ summary: 'Update conversation starters (partial save OK)' })
  @ApiResponse({ status: 200, type: ConversationStartersResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateConversationStarters(
    @Request() req: any,
    @Body() dto: UpdateConversationStartersDto,
  ): Promise<ConversationStartersResponse> {
    return this.preferencesService.updateConversationStarters(req.user.id, dto);
  }
}
