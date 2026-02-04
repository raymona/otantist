import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ example: 'INVITE2024' })
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  inviteCode!: string;

  @ApiProperty({ example: 'fr', enum: ['fr', 'en'] })
  @IsIn(['fr', 'en'])
  language!: 'fr' | 'en';
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123def456...' })
  @IsString()
  @MinLength(32)
  @MaxLength(64)
  token!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123def456...' })
  @IsString()
  @MinLength(32)
  @MaxLength(64)
  token!: string;

  @ApiProperty({ example: 'NewSecureP@ss123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}

export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;
}