import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum SocialEnergyLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export class UpdateSocialEnergyDto {
  @ApiProperty({ enum: SocialEnergyLevel, example: 'medium' })
  @IsEnum(SocialEnergyLevel)
  level!: SocialEnergyLevel;
}

export class UserStateResponse {
  @ApiPropertyOptional({ enum: ['high', 'medium', 'low'] })
  socialEnergy?: string | null;

  @ApiPropertyOptional()
  energyUpdatedAt?: Date | null;

  @ApiProperty()
  calmModeActive!: boolean;

  @ApiPropertyOptional()
  calmModeStarted?: Date | null;

  @ApiProperty()
  isOnline!: boolean;

  @ApiPropertyOptional()
  lastSeen?: Date | null;
}

export class CalmModeResponse {
  @ApiProperty()
  active!: boolean;

  @ApiPropertyOptional()
  startedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Minutes in calm mode (current session)' })
  durationMinutes?: number;
}
