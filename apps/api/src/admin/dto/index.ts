import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
