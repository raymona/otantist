import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ManagedMemberResponse,
  MemberIndicatorResponse,
  ParentAlertResponse,
  GenerateCodeResponse,
  LinkToParentResponse,
} from './dto';

@Injectable()
export class ParentDashboardService {
  private readonly logger = new Logger(ParentDashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getManagedMembers(parentAccountId: string): Promise<ManagedMemberResponse[]> {
    const relations = await this.prisma.parentManagedAccount.findMany({
      where: { parentAccountId, status: 'active' },
      include: {
        memberAccount: {
          include: {
            user: { select: { id: true, displayName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return relations.map(rel => ({
      id: rel.id,
      memberAccountId: rel.memberAccountId,
      relationship: rel.relationship,
      status: rel.status,
      consentGivenAt: rel.consentGivenAt,
      createdAt: rel.createdAt,
      member: {
        userId: rel.memberAccount.user?.id ?? '',
        displayName: rel.memberAccount.user?.displayName ?? '',
        accountStatus: rel.memberAccount.status,
      },
    }));
  }

  async getMemberIndicators(
    parentAccountId: string,
    memberUserId: string
  ): Promise<MemberIndicatorResponse[]> {
    await this.verifyParentAccess(parentAccountId, memberUserId);

    const indicators = await this.prisma.memberIndicator.findMany({
      where: { userId: memberUserId },
      orderBy: { recordedAt: 'desc' },
      take: 30, // Last 30 days
    });

    return indicators.map(ind => ({
      recordedAt: ind.recordedAt,
      socialEnergyAvg: ind.socialEnergyAvg,
      calmModeMinutes: ind.calmModeMinutes,
      messagesSent: ind.messagesSent,
      messagesReceived: ind.messagesReceived,
    }));
  }

  async getMemberAlerts(
    parentAccountId: string,
    memberUserId: string
  ): Promise<ParentAlertResponse[]> {
    await this.verifyParentAccess(parentAccountId, memberUserId);

    const alerts = await this.prisma.parentAlert.findMany({
      where: { parentAccountId, memberUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return alerts.map(alert => ({
      id: alert.id,
      alertType: alert.alertType,
      severity: alert.severity,
      messageFr: alert.messageFr,
      messageEn: alert.messageEn,
      acknowledged: alert.acknowledged,
      acknowledgedAt: alert.acknowledgedAt,
      createdAt: alert.createdAt,
    }));
  }

  async acknowledgeAlert(
    parentAccountId: string,
    memberUserId: string,
    alertId: string
  ): Promise<ParentAlertResponse> {
    await this.verifyParentAccess(parentAccountId, memberUserId);

    const alert = await this.prisma.parentAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException({
        code: 'ALERT_NOT_FOUND',
        message_en: 'Alert not found',
        message_fr: 'Alerte introuvable',
      });
    }

    if (alert.parentAccountId !== parentAccountId) {
      throw new ForbiddenException({
        code: 'ALERT_ACCESS_DENIED',
        message_en: 'Not authorized to access this alert',
        message_fr: 'Non autorisé à accéder à cette alerte',
      });
    }

    const updated = await this.prisma.parentAlert.update({
      where: { id: alertId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      alertType: updated.alertType,
      severity: updated.severity,
      messageFr: updated.messageFr,
      messageEn: updated.messageEn,
      acknowledged: updated.acknowledged,
      acknowledgedAt: updated.acknowledgedAt,
      createdAt: updated.createdAt,
    };
  }

  async generateLinkingCode(
    accountId: string,
    relationship: 'parent' | 'legal_guardian' | 'other' = 'parent'
  ): Promise<GenerateCodeResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException({
        code: 'ACCOUNT_NOT_FOUND',
        message_en: 'Account not found',
        message_fr: 'Compte introuvable',
      });
    }

    // Only adult accounts can generate linking codes
    if (account.accountType !== 'adult') {
      throw new ForbiddenException({
        code: 'NOT_ALLOWED',
        message_en: 'Only adult accounts can generate linking codes',
        message_fr: 'Seuls les comptes adultes peuvent générer des codes de liaison',
      });
    }

    // Generate a unique code: LINK- + 8 random uppercase alphanumeric chars
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded I/O/1/0 to avoid confusion
    let code = 'LINK-';
    const bytes = randomBytes(8);
    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const linkingCode = await this.prisma.parentLinkingCode.create({
      data: {
        code,
        parentAccountId: accountId,
        relationship,
        expiresAt,
      },
    });

    // Also generate a single-use invite code for the minor to register with
    const inviteChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let inviteCodeStr = 'INV-';
    const inviteBytes = randomBytes(6);
    for (let i = 0; i < 6; i++) {
      inviteCodeStr += inviteChars[inviteBytes[i] % inviteChars.length];
    }

    await this.prisma.inviteCode.create({
      data: {
        code: inviteCodeStr,
        maxUses: 1,
        expiresAt,
        createdById: accountId,
      },
    });

    this.logger.log(`Linking code and invite code generated by account ${accountId}`);

    return {
      code: linkingCode.code,
      inviteCode: inviteCodeStr,
      expiresAt: linkingCode.expiresAt,
    };
  }

  async linkToParent(callerAccountId: string, code: string): Promise<LinkToParentResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: callerAccountId },
      include: { user: true },
    });

    if (!account || !account.user) {
      throw new NotFoundException({
        code: 'ACCOUNT_NOT_FOUND',
        message_en: 'Account not found',
        message_fr: 'Compte introuvable',
      });
    }

    // Caller must be an adult account type (not already parent_managed)
    if (account.accountType !== 'adult') {
      throw new BadRequestException({
        code: 'ALREADY_LINKED',
        message_en: 'Your account is already linked or cannot be linked',
        message_fr: 'Votre compte est déjà lié ou ne peut pas être lié',
      });
    }

    // Caller must have age_14_17
    if (account.user.ageGroup !== 'age_14_17') {
      throw new BadRequestException({
        code: 'NOT_MINOR',
        message_en: 'Only accounts with age group 14-17 can be linked to a parent',
        message_fr: "Seuls les comptes du groupe d'âge 14-17 peuvent être liés à un parent",
      });
    }

    // Find the linking code
    const linkingCode = await this.prisma.parentLinkingCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!linkingCode) {
      throw new BadRequestException({
        code: 'INVALID_CODE',
        message_en: 'Invalid linking code',
        message_fr: 'Code de liaison invalide',
      });
    }

    if (linkingCode.usedByAccountId) {
      throw new BadRequestException({
        code: 'CODE_USED',
        message_en: 'This linking code has already been used',
        message_fr: 'Ce code de liaison a déjà été utilisé',
      });
    }

    if (linkingCode.expiresAt < new Date()) {
      throw new BadRequestException({
        code: 'CODE_EXPIRED',
        message_en: 'This linking code has expired. Ask your parent to generate a new one.',
        message_fr: "Ce code de liaison a expiré. Demandez à votre parent d'en générer un nouveau.",
      });
    }

    // Cannot link to yourself
    if (linkingCode.parentAccountId === callerAccountId) {
      throw new BadRequestException({
        code: 'SELF_LINK',
        message_en: 'You cannot link your own account',
        message_fr: 'Vous ne pouvez pas lier votre propre compte',
      });
    }

    // Perform linking in a transaction
    await this.prisma.$transaction([
      // 1. Update caller's account type to parent_managed
      this.prisma.account.update({
        where: { id: callerAccountId },
        data: { accountType: 'parent_managed' },
      }),
      // 2. Create parent-child relationship
      this.prisma.parentManagedAccount.create({
        data: {
          parentAccountId: linkingCode.parentAccountId,
          memberAccountId: callerAccountId,
          relationship: linkingCode.relationship,
          status: 'active',
          consentGivenAt: new Date(),
        },
      }),
      // 3. Mark code as used
      this.prisma.parentLinkingCode.update({
        where: { id: linkingCode.id },
        data: { usedByAccountId: callerAccountId },
      }),
    ]);

    this.logger.log(
      `Account ${callerAccountId} linked to parent ${linkingCode.parentAccountId} via code ${linkingCode.code}`
    );

    return { success: true };
  }

  private async verifyParentAccess(parentAccountId: string, memberUserId: string): Promise<void> {
    // Look up the member's account ID from their user ID
    const memberUser = await this.prisma.user.findUnique({
      where: { id: memberUserId },
      select: { accountId: true },
    });

    if (!memberUser) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message_en: 'Member not found',
        message_fr: 'Membre introuvable',
      });
    }

    const relation = await this.prisma.parentManagedAccount.findUnique({
      where: {
        parentAccountId_memberAccountId: {
          parentAccountId,
          memberAccountId: memberUser.accountId,
        },
      },
    });

    if (!relation || relation.status !== 'active') {
      throw new ForbiddenException({
        code: 'MEMBER_ACCESS_DENIED',
        message_en: 'Not authorized to access this member',
        message_fr: 'Non autorisé à accéder à ce membre',
      });
    }
  }
}
