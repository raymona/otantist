import { IsString, IsEmail, IsIn, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitInviteRequestDto {
  @ApiProperty({ description: 'Name or pseudonym' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Requester context', enum: ['parent', 'adult', 'organization'] })
  @IsString()
  @IsIn(['parent', 'adult', 'organization'])
  context!: 'parent' | 'adult' | 'organization';

  @ApiPropertyOptional({ description: 'Optional message' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({ description: 'Preferred language', enum: ['fr', 'en'] })
  @IsOptional()
  @IsIn(['fr', 'en'])
  language?: 'fr' | 'en';
}

export class ReviewInviteRequestDto {
  @ApiProperty({ description: 'Invite request ID' })
  @IsString()
  requestId!: string;

  @ApiProperty({ description: 'Decision', enum: ['approved', 'rejected'] })
  @IsString()
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';
}

export class InviteRequestResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  context!: string;

  @ApiPropertyOptional()
  message!: string | null;

  @ApiProperty()
  language!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  reviewedAt!: Date | null;

  @ApiPropertyOptional()
  inviteCode?: string | null;
}
