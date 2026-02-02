import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    inviteCode: string;
    language: 'fr' | 'en';
  }) {
    // Validate invite code
    const invite = await this.prisma.inviteCode.findUnique({
      where: { code: data.inviteCode },
    });

    if (!invite) {
      throw new BadRequestException('Invalid invite code');
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new BadRequestException('Invite code has expired');
    }

    if (invite.currentUses >= invite.maxUses) {
      throw new BadRequestException('Invite code has been fully used');
    }

    // Check if email exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { email: data.email },
    });

    if (existingAccount) {
      throw new BadRequestException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create account and user in transaction
    const account = await this.prisma.$transaction(async (tx) => {
      // Create account
      const newAccount = await tx.account.create({
        data: {
          email: data.email,
          passwordHash,
          accountType: 'adult',
          preferredLanguage: data.language,
          inviteCodeUsed: data.inviteCode,
        },
      });

      // Create associated user profile
      await tx.user.create({
        data: {
          accountId: newAccount.id,
        },
      });

      // Increment invite code usage
      await tx.inviteCode.update({
        where: { id: invite.id },
        data: { currentUses: { increment: 1 } },
      });

      return newAccount;
    });

    // TODO: Send verification email

    return {
      accountId: account.id,
      verificationSent: true,
    };
  }

  async login(email: string, password: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: { user: true },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, account.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (account.status === 'suspended') {
      throw new UnauthorizedException('Account is suspended');
    }

    // Update last login
    await this.prisma.account.update({
      where: { id: account.id },
      data: { lastLogin: new Date() },
    });

    // Generate tokens
    const payload = { sub: account.id, email: account.email };
    
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
      user: {
        id: account.user?.id,
        accountId: account.id,
        email: account.email,
        displayName: account.user?.displayName,
        language: account.preferredLanguage,
        onboardingComplete: account.user?.onboardingComplete,
      },
    };
  }

  async validateToken(payload: { sub: string; email: string }) {
    const account = await this.prisma.account.findUnique({
      where: { id: payload.sub },
      include: { user: true },
    });

    if (!account || account.status === 'suspended') {
      throw new UnauthorizedException();
    }

    return account;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const account = await this.prisma.account.findUnique({
        where: { id: payload.sub },
      });

      if (!account || account.status === 'suspended') {
        throw new UnauthorizedException();
      }

      const newPayload = { sub: account.id, email: account.email };

      return {
        accessToken: this.jwtService.sign(newPayload),
        refreshToken: this.jwtService.sign(newPayload, {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        }),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
