import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export enum ModerationAction {
  DISMISSED = 'dismissed',
  WARNED = 'warned',
  REMOVED = 'removed',
  SUSPENDED = 'suspended',
}

export class ResolveQueueItemDto {
  @ApiProperty({ enum: ModerationAction })
  @IsEnum(ModerationAction)
  action!: ModerationAction;

  @ApiPropertyOptional({ maxLength: 1000, description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ModerationQueueItemResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  itemType!: string;

  @ApiProperty()
  itemId!: string;

  @ApiProperty()
  flaggedBy!: string;

  @ApiPropertyOptional()
  flagReason?: string | null;

  @ApiPropertyOptional()
  aiConfidence?: number | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  priority!: string;

  @ApiPropertyOptional()
  actionTaken?: string | null;

  @ApiPropertyOptional()
  resolutionNotes?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  resolvedAt?: Date | null;

  @ApiPropertyOptional({ description: 'Related content (message text, user info, etc.)' })
  relatedContent?: any;
}

export class ModerationStatsResponse {
  @ApiProperty()
  pending!: number;

  @ApiProperty()
  reviewing!: number;

  @ApiProperty()
  resolvedToday!: number;

  @ApiProperty()
  totalResolved!: number;

  @ApiProperty()
  byPriority!: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
}
