import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength, MinLength, IsIn } from 'class-validator';

export enum AgeGroup {
  AGE_14_17 = 'age_14_17',
  AGE_18_25 = 'age_18_25',
  AGE_26_40 = 'age_26_40',
  AGE_40_PLUS = 'age_40_plus',
}

export enum ProfileVisibility {
  VISIBLE = 'visible',
  LIMITED = 'limited',
  HIDDEN = 'hidden',
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Alex', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({ enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;

  @ApiPropertyOptional({ enum: ProfileVisibility })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;
}

export class UpdateLanguageDto {
  @ApiProperty({ example: 'fr', enum: ['fr', 'en'] })
  @IsIn(['fr', 'en'])
  language!: 'fr' | 'en';
}

export class UserProfileResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  accountId!: string;

  @ApiPropertyOptional()
  displayName?: string | null;

  @ApiPropertyOptional()
  ageGroup?: string | null;

  @ApiProperty()
  profileVisibility!: string;

  @ApiProperty()
  onboardingComplete!: boolean;

  @ApiPropertyOptional()
  onboardingStep?: string | null;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  language!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty()
  legalAccepted!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class OnboardingStatusResponse {
  @ApiProperty()
  complete!: boolean;

  @ApiPropertyOptional()
  currentStep?: string | null;

  @ApiProperty()
  steps!: {
    emailVerified: boolean;
    legalAccepted: boolean;
    basicProfile: boolean;
    communicationPrefs: boolean;
    sensoryPrefs: boolean;
    conversationStarters: boolean;
  };
}

export class HowToTalkToMeResponse {
  @ApiProperty()
  displayName!: string | null;

  @ApiPropertyOptional()
  preferredTone?: string | null;

  @ApiProperty()
  commModes!: string[];

  @ApiPropertyOptional()
  slowRepliesOk?: boolean | null;

  @ApiPropertyOptional()
  oneMessageAtTime?: boolean | null;

  @ApiPropertyOptional()
  readWithoutReply?: boolean | null;

  @ApiProperty()
  goodTopics!: string[];

  @ApiProperty()
  avoidTopics!: string[];

  @ApiProperty()
  interactionTips!: string[];
}

export class UserDirectoryEntryResponse {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional()
  displayName!: string | null;

  @ApiProperty()
  isOnline!: boolean;

  @ApiPropertyOptional()
  lastSeen!: string | null;

  @ApiPropertyOptional()
  socialEnergy!: string | null;

  @ApiProperty()
  calmModeActive!: boolean;
}

export class UserDirectoryResponse {
  @ApiProperty({ type: [UserDirectoryEntryResponse] })
  users!: UserDirectoryEntryResponse[];

  @ApiProperty()
  total!: number;
}
