import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { createMockPrismaService, MockPrismaService } from '../../test/prisma-mock';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrismaService;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let emailService: { sendVerificationEmail: jest.Mock; sendPasswordResetEmail: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    jwtService = { sign: jest.fn().mockReturnValue('mock-token'), verify: jest.fn() };
    emailService = { sendVerificationEmail: jest.fn(), sendPasswordResetEmail: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('test-value') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      inviteCode: 'INVITE1',
      language: 'en' as const,
    };

    it('should register a new user with valid invite code', async () => {
      prisma.inviteCode.findUnique.mockResolvedValue({
        id: 'invite-id',
        code: 'INVITE1',
        maxUses: 5,
        currentUses: 0,
        expiresAt: null,
      });
      prisma.account.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockAccount = { id: 'account-id', email: 'test@example.com' };
      prisma.$transaction.mockResolvedValue(mockAccount);
      prisma.authToken.deleteMany.mockResolvedValue({ count: 0 });
      prisma.authToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accountId: 'account-id',
        verificationSent: true,
      });
    });

    it('should throw if invite code is invalid', async () => {
      prisma.inviteCode.findUnique.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if invite code is expired', async () => {
      prisma.inviteCode.findUnique.mockResolvedValue({
        id: 'invite-id',
        code: 'INVITE1',
        maxUses: 5,
        currentUses: 0,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if invite code is fully used', async () => {
      prisma.inviteCode.findUnique.mockResolvedValue({
        id: 'invite-id',
        code: 'INVITE1',
        maxUses: 1,
        currentUses: 1,
        expiresAt: null,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if email already registered', async () => {
      prisma.inviteCode.findUnique.mockResolvedValue({
        id: 'invite-id',
        code: 'INVITE1',
        maxUses: 5,
        currentUses: 0,
        expiresAt: null,
      });
      prisma.account.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should return tokens on valid credentials', async () => {
      prisma.account.findUnique.mockResolvedValue({
        id: 'account-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        status: 'active',
        preferredLanguage: 'en',
        user: {
          id: 'user-id',
          displayName: 'Test',
          onboardingComplete: false,
        },
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.account.update.mockResolvedValue({});

      const result = await service.login('test@example.com', 'password');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw on invalid email', async () => {
      prisma.account.findUnique.mockResolvedValue(null);

      await expect(
        service.login('wrong@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw on invalid password', async () => {
      prisma.account.findUnique.mockResolvedValue({
        id: 'account-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        status: 'active',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login('test@example.com', 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if account is suspended', async () => {
      prisma.account.findUnique.mockResolvedValue({
        id: 'account-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        status: 'suspended',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      prisma.authToken.findUnique.mockResolvedValue({
        id: 'token-id',
        accountId: 'account-id',
        token: 'valid-token',
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 60000),
        usedAt: null,
        account: { id: 'account-id' },
      });
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.verifyEmail('valid-token');
      expect(result).toEqual({ verified: true });
    });

    it('should throw on invalid token', async () => {
      prisma.authToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('bad-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw on expired token', async () => {
      prisma.authToken.findUnique.mockResolvedValue({
        id: 'token-id',
        accountId: 'account-id',
        token: 'expired-token',
        type: 'email_verification',
        expiresAt: new Date('2020-01-01'),
        usedAt: null,
        account: { id: 'account-id' },
      });

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw on already-used token', async () => {
      prisma.authToken.findUnique.mockResolvedValue({
        id: 'token-id',
        accountId: 'account-id',
        token: 'used-token',
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 60000),
        usedAt: new Date(),
        account: { id: 'account-id' },
      });

      await expect(service.verifyEmail('used-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      prisma.authToken.findUnique.mockResolvedValue({
        id: 'token-id',
        accountId: 'account-id',
        token: 'valid-token',
        type: 'password_reset',
        expiresAt: new Date(Date.now() + 60000),
        usedAt: null,
        account: { id: 'account-id' },
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.resetPassword('valid-token', 'NewPass123!');
      expect(result).toEqual({ reset: true });
    });

    it('should throw on invalid token', async () => {
      prisma.authToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'NewPass123!'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should return new token pair on valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'account-id', email: 'test@example.com' });
      prisma.account.findUnique.mockResolvedValue({
        id: 'account-id',
        email: 'test@example.com',
        status: 'active',
      });

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw on invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if account is suspended', async () => {
      jwtService.verify.mockReturnValue({ sub: 'account-id', email: 'test@example.com' });
      prisma.account.findUnique.mockResolvedValue({
        id: 'account-id',
        email: 'test@example.com',
        status: 'suspended',
      });

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
