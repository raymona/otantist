import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService
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
    const account = await this.prisma.$transaction(async tx => {
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

    // Send verification email
    await this.sendVerificationEmail(account.id, account.email, data.language);

    return {
      accountId: account.id,
      verificationSent: true,
    };
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async sendVerificationEmail(
    accountId: string,
    email: string,
    language: 'fr' | 'en'
  ): Promise<void> {
    // Delete any existing verification tokens for this account
    await this.prisma.authToken.deleteMany({
      where: {
        accountId,
        type: 'email_verification',
      },
    });

    // Create new verification token (expires in 24 hours)
    const token = this.generateToken();
    await this.prisma.authToken.create({
      data: {
        accountId,
        token,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Send the email
    await this.emailService.sendVerificationEmail(email, token, language);
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    const authToken = await this.prisma.authToken.findUnique({
      where: { token },
      include: { account: true },
    });

    if (!authToken) {
      throw new BadRequestException('Invalid verification token');
    }

    if (authToken.type !== 'email_verification') {
      throw new BadRequestException('Invalid token type');
    }

    if (authToken.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    if (authToken.usedAt) {
      throw new BadRequestException('Token has already been used');
    }

    // Mark email as verified and token as used
    await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: authToken.accountId },
        data: {
          emailVerified: true,
          status: 'active',
        },
      }),
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { verified: true };
  }

  async resendVerificationEmail(email: string): Promise<{ sent: boolean }> {
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      // Don't reveal if email exists
      return { sent: true };
    }

    if (account.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.sendVerificationEmail(
      account.id,
      account.email,
      account.preferredLanguage as 'fr' | 'en'
    );

    return { sent: true };
  }

  async forgotPassword(email: string): Promise<{ sent: boolean }> {
    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    // Don't reveal if email exists - always return success
    if (!account) {
      return { sent: true };
    }

    // Delete any existing password reset tokens for this account
    await this.prisma.authToken.deleteMany({
      where: {
        accountId: account.id,
        type: 'password_reset',
      },
    });

    // Create new reset token (expires in 1 hour)
    const token = this.generateToken();
    await this.prisma.authToken.create({
      data: {
        accountId: account.id,
        token,
        type: 'password_reset',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    // Send the email
    await this.emailService.sendPasswordResetEmail(
      account.email,
      token,
      account.preferredLanguage as 'fr' | 'en'
    );

    return { sent: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ reset: boolean }> {
    const authToken = await this.prisma.authToken.findUnique({
      where: { token },
      include: { account: true },
    });

    if (!authToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (authToken.type !== 'password_reset') {
      throw new BadRequestException('Invalid token type');
    }

    if (authToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    if (authToken.usedAt) {
      throw new BadRequestException('Token has already been used');
    }

    // Hash new password and update
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: authToken.accountId },
        data: { passwordHash },
      }),
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { reset: true };
  }

  async acceptTerms(accountId: string): Promise<{ accepted: boolean }> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (account.legalAcceptedAt) {
      throw new BadRequestException('Terms already accepted');
    }

    await this.prisma.account.update({
      where: { id: accountId },
      data: { legalAcceptedAt: new Date() },
    });

    return { accepted: true };
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
        emailVerified: account.emailVerified,
        legalAccepted: !!account.legalAcceptedAt,
        onboardingComplete: account.user?.onboardingComplete,
        onboardingStep: account.user?.onboardingStep,
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
