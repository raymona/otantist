import { IsString, IsIn, IsInt, Min, IsDateString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetRoleDto {
  @ApiProperty({ description: 'Account ID to update' })
  @IsString()
  accountId!: string;

  @ApiProperty({ description: 'New role', enum: ['adult', 'moderator', 'super_admin'] })
  @IsString()
  @IsIn(['adult', 'moderator', 'super_admin'])
  role!: 'adult' | 'moderator' | 'super_admin';
}

export class AdminUserResponse {
  @ApiProperty()
  accountId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  displayName!: string | null;

  @ApiProperty()
  accountType!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty()
  onboardingComplete!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class CreateInviteCodeDto {
  @ApiProperty({ description: 'Invite code string (e.g. BETA2025)' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiPropertyOptional({ description: 'Maximum number of uses (default 1)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Expiration date (ISO string, optional)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class InviteCodeResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  maxUses!: number;

  @ApiProperty()
  currentUses!: number;

  @ApiPropertyOptional()
  expiresAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
