import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  MaxLength,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Communication Preferences
// ============================================

export enum TonePreference {
  GENTLE = 'gentle',
  DIRECT = 'direct',
  ENTHUSIASTIC = 'enthusiastic',
  FORMAL = 'formal',
}

export class UpdateCommunicationPrefsDto {
  @ApiPropertyOptional({ example: ['text', 'emoji'], description: 'Preferred communication modes' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  commModes?: string[];

  @ApiPropertyOptional({ enum: TonePreference })
  @IsOptional()
  @IsEnum(TonePreference)
  preferredTone?: TonePreference;

  @ApiPropertyOptional({ example: true, description: 'Slow replies are OK' })
  @IsOptional()
  @IsBoolean()
  slowRepliesOk?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Prefer one message at a time' })
  @IsOptional()
  @IsBoolean()
  oneMessageAtTime?: boolean;

  @ApiPropertyOptional({ example: true, description: 'OK to read without replying' })
  @IsOptional()
  @IsBoolean()
  readWithoutReply?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Mark section as complete' })
  @IsOptional()
  @IsBoolean()
  sectionComplete?: boolean;
}

export class CommunicationPrefsResponse {
  @ApiProperty()
  commModes!: string[];

  @ApiPropertyOptional()
  preferredTone?: string | null;

  @ApiPropertyOptional()
  slowRepliesOk?: boolean | null;

  @ApiPropertyOptional()
  oneMessageAtTime?: boolean | null;

  @ApiPropertyOptional()
  readWithoutReply?: boolean | null;

  @ApiProperty()
  sectionComplete!: boolean;
}

// ============================================
// Sensory Preferences
// ============================================

export enum ColorIntensity {
  STANDARD = 'standard',
  REDUCED = 'reduced',
  MINIMAL = 'minimal',
}

export class UpdateSensoryPrefsDto {
  @ApiPropertyOptional({ example: false, description: 'Enable animations' })
  @IsOptional()
  @IsBoolean()
  enableAnimations?: boolean;

  @ApiPropertyOptional({ enum: ColorIntensity })
  @IsOptional()
  @IsEnum(ColorIntensity)
  colorIntensity?: ColorIntensity;

  @ApiPropertyOptional({ example: false, description: 'Enable sounds' })
  @IsOptional()
  @IsBoolean()
  soundEnabled?: boolean;

  @ApiPropertyOptional({ example: 5, description: 'Max notifications per hour' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  notificationLimit?: number;

  @ApiPropertyOptional({ example: true, description: 'Group notifications' })
  @IsOptional()
  @IsBoolean()
  notificationGrouped?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Mark section as complete' })
  @IsOptional()
  @IsBoolean()
  sectionComplete?: boolean;
}

export class SensoryPrefsResponse {
  @ApiProperty()
  enableAnimations!: boolean;

  @ApiPropertyOptional()
  colorIntensity?: string | null;

  @ApiProperty()
  soundEnabled!: boolean;

  @ApiPropertyOptional()
  notificationLimit?: number | null;

  @ApiProperty()
  notificationGrouped!: boolean;

  @ApiProperty()
  sectionComplete!: boolean;
}

// ============================================
// Time Boundaries
// ============================================

export class TimeBoundaryDto {
  @ApiProperty({ example: 1, description: 'Day of week (0=Sunday, 6=Saturday)' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: '09:00', description: 'Available start time (HH:MM)' })
  @IsString()
  @MaxLength(5)
  availableStart!: string;

  @ApiProperty({ example: '21:00', description: 'Available end time (HH:MM)' })
  @IsString()
  @MaxLength(5)
  availableEnd!: string;

  @ApiPropertyOptional({ example: 'America/Montreal', description: 'Timezone' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timezone?: string;
}

export class UpdateTimeBoundariesDto {
  @ApiProperty({ type: [TimeBoundaryDto], description: 'Time boundaries for each day' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeBoundaryDto)
  @ArrayMaxSize(7)
  boundaries!: TimeBoundaryDto[];
}

export class TimeBoundaryResponse {
  @ApiProperty()
  dayOfWeek!: number;

  @ApiProperty()
  availableStart!: string;

  @ApiProperty()
  availableEnd!: string;

  @ApiProperty()
  timezone!: string;
}

// ============================================
// Conversation Starters
// ============================================

export class UpdateConversationStartersDto {
  @ApiPropertyOptional({ example: ['video games', 'cats'], description: 'Good topics to discuss' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  goodTopics?: string[];

  @ApiPropertyOptional({ example: ['politics'], description: 'Topics to avoid' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  avoidTopics?: string[];

  @ApiPropertyOptional({ example: ['I need time to respond'], description: 'Interaction tips' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  interactionTips?: string[];

  @ApiPropertyOptional({ example: true, description: 'Mark section as complete' })
  @IsOptional()
  @IsBoolean()
  sectionComplete?: boolean;
}

export class ConversationStartersResponse {
  @ApiProperty()
  goodTopics!: string[];

  @ApiProperty()
  avoidTopics!: string[];

  @ApiProperty()
  interactionTips!: string[];

  @ApiProperty()
  sectionComplete!: boolean;
}
