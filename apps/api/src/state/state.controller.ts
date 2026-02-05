import {
  Controller,
  Get,
  Post,
  Patch,
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
import { StateService } from './state.service';
import {
  UpdateSocialEnergyDto,
  UserStateResponse,
  CalmModeResponse,
} from './dto';

@ApiTags('state')
@Controller('state')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StateController {
  constructor(private stateService: StateService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current user state' })
  @ApiResponse({ status: 200, type: UserStateResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentState(@Request() req: any): Promise<UserStateResponse> {
    return this.stateService.getCurrentState(req.user.id);
  }

  @Patch('social-energy')
  @ApiOperation({ summary: 'Update social energy level' })
  @ApiResponse({ status: 200, type: UserStateResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSocialEnergy(
    @Request() req: any,
    @Body() dto: UpdateSocialEnergyDto,
  ): Promise<UserStateResponse> {
    return this.stateService.updateSocialEnergy(req.user.id, dto.level);
  }

  @Post('calm-mode/activate')
  @ApiOperation({ summary: 'Activate calm mode' })
  @ApiResponse({ status: 201, type: CalmModeResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async activateCalmMode(@Request() req: any): Promise<CalmModeResponse> {
    return this.stateService.activateCalmMode(req.user.id);
  }

  @Post('calm-mode/deactivate')
  @ApiOperation({ summary: 'Deactivate calm mode' })
  @ApiResponse({ status: 201, type: CalmModeResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deactivateCalmMode(@Request() req: any): Promise<CalmModeResponse> {
    return this.stateService.deactivateCalmMode(req.user.id);
  }
}
