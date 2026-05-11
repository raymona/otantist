import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUserResponse, SetRoleDto, CreateInviteCodeDto, InviteCodeResponse } from './dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async listUsers(search?: string): Promise<AdminUserResponse[]> {
    const where: any = {};

    if (search?.trim()) {
      where.OR = [
        { email: { contains: search.trim(), mode: 'insensitive' } },
        { user: { displayName: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const accounts = await this.prisma.account.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return accounts.map(account => ({
      accountId: account.id,
      email: account.email,
      displayName: account.user?.displayName ?? null,
      accountType: account.accountType,
      status: account.status,
      emailVerified: account.emailVerified,
      onboardingComplete: account.user?.onboardingComplete ?? false,
      createdAt: account.createdAt,
    }));
  }

  async setRole(dto: SetRoleDto): Promise<AdminUserResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
      include: { user: true },
    });

    if (!account) {
      throw new NotFoundException({
        code: 'ACCOUNT_NOT_FOUND',
        message_en: 'Account not found',
        message_fr: 'Compte non trouvé',
      });
    }

    if (account.accountType === 'parent_managed') {
      throw new BadRequestException({
        code: 'CANNOT_CHANGE_MANAGED_ROLE',
        message_en: 'Cannot change role of parent-managed accounts',
        message_fr: 'Impossible de modifier le rôle des comptes gérés par un parent',
      });
    }

    await this.prisma.account.update({
      where: { id: dto.accountId },
      data: { accountType: dto.role },
    });

    return {
      accountId: account.id,
      email: account.email,
      displayName: account.user?.displayName ?? null,
      accountType: dto.role,
      status: account.status,
      emailVerified: account.emailVerified,
      onboardingComplete: account.user?.onboardingComplete ?? false,
      createdAt: account.createdAt,
    };
  }

  async createInviteCode(dto: CreateInviteCodeDto): Promise<InviteCodeResponse> {
    // Check if code already exists
    const existing = await this.prisma.inviteCode.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException({
        code: 'CODE_EXISTS',
        message_en: 'An invite code with this value already exists',
        message_fr: "Un code d'invitation avec cette valeur existe déjà",
      });
    }

    const inviteCode = await this.prisma.inviteCode.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        maxUses: dto.maxUses ?? 1,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      id: inviteCode.id,
      code: inviteCode.code,
      maxUses: inviteCode.maxUses,
      currentUses: inviteCode.currentUses,
      expiresAt: inviteCode.expiresAt,
      createdAt: inviteCode.createdAt,
    };
  }

  async listInviteCodes(): Promise<InviteCodeResponse[]> {
    const codes = await this.prisma.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return codes.map(code => ({
      id: code.id,
      code: code.code,
      maxUses: code.maxUses,
      currentUses: code.currentUses,
      expiresAt: code.expiresAt,
      createdAt: code.createdAt,
    }));
  }

  async deleteUser(accountId: string, requestingAccountId: string): Promise<void> {
    if (accountId === requestingAccountId) {
      throw new BadRequestException({
        code: 'CANNOT_DELETE_SELF',
        message_en: 'You cannot delete your own account',
        message_fr: 'Vous ne pouvez pas supprimer votre propre compte',
      });
    }

    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true },
    });

    if (!account) {
      throw new NotFoundException({
        code: 'ACCOUNT_NOT_FOUND',
        message_en: 'Account not found',
        message_fr: 'Compte non trouvé',
      });
    }

    if (account.accountType === 'super_admin') {
      throw new ForbiddenException({
        code: 'CANNOT_DELETE_ADMIN',
        message_en: 'Cannot delete a super admin account',
        message_fr: 'Impossible de supprimer un compte super admin',
      });
    }

    const userId = account.user?.id;

    await this.prisma.$transaction(async tx => {
      if (userId) {
        // Delete conversations and their cascaded children (messages, hidden, deletions)
        await tx.conversation.deleteMany({
          where: { OR: [{ userAId: userId }, { userBId: userId }] },
        });

        // Delete block relationships
        await tx.blockedUser.deleteMany({
          where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        });

        // Delete reports (as reporter or reported)
        await tx.userReport.deleteMany({
          where: { OR: [{ reporterId: userId }, { reportedUserId: userId }] },
        });

        // Delete parent alerts (as member)
        await tx.parentAlert.deleteMany({
          where: { memberUserId: userId },
        });
      }

      // Delete parent alerts (as parent account)
      await tx.parentAlert.deleteMany({
        where: { parentAccountId: accountId },
      });

      // Delete parent-managed relationships
      await tx.parentManagedAccount.deleteMany({
        where: { OR: [{ parentAccountId: accountId }, { memberAccountId: accountId }] },
      });

      // Delete parent linking codes
      await tx.parentLinkingCode.deleteMany({
        where: { parentAccountId: accountId },
      });

      // Nullify references in invite codes and moderation queue
      await tx.inviteCode.updateMany({
        where: { createdById: accountId },
        data: { createdById: null },
      });

      await tx.moderationQueue.updateMany({
        where: { reviewedById: accountId },
        data: { reviewedById: null },
      });

      // Delete the account (cascades to user → preferences, state, etc.)
      await tx.account.delete({ where: { id: accountId } });
    });

    this.logger.log(`Account ${accountId} (${account.email}) deleted by ${requestingAccountId}`);
  }
}
