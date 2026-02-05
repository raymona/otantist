import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';

// ============================================
// Blocked Users
// ============================================

export class BlockedUserResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  displayName!: string | null;

  @ApiProperty()
  blockedAt!: Date;
}

// ============================================
// Reports
// ============================================

export enum ReportReason {
  HARASSMENT = 'harassment',
  INAPPROPRIATE = 'inappropriate',
  SPAM = 'spam',
  SAFETY_CONCERN = 'safety_concern',
  OTHER = 'other',
}

export class SubmitReportDto {
  @ApiPropertyOptional({ description: 'ID of user being reported' })
  @IsOptional()
  @IsUUID()
  reportedUserId?: string;

  @ApiPropertyOptional({ description: 'ID of message being reported' })
  @IsOptional()
  @IsUUID()
  reportedMessageId?: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @ApiPropertyOptional({ maxLength: 1000, description: 'Additional details' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class ReportResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  reason!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  createdAt!: Date;
}
