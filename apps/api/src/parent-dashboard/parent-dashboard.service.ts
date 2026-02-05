import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ManagedMemberResponse,
  MemberIndicatorResponse,
  ParentAlertResponse,
} from './dto';

@Injectable()
export class ParentDashboardService {
  constructor(private prisma: PrismaService) {}

  async getManagedMembers(
    parentAccountId: string,
  ): Promise<ManagedMemberResponse[]> {
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

    return relations.map((rel) => ({
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
    memberUserId: string,
  ): Promise<MemberIndicatorResponse[]> {
    await this.verifyParentAccess(parentAccountId, memberUserId);

    const indicators = await this.prisma.memberIndicator.findMany({
      where: { userId: memberUserId },
      orderBy: { recordedAt: 'desc' },
      take: 30, // Last 30 days
    });

    return indicators.map((ind) => ({
      recordedAt: ind.recordedAt,
      socialEnergyAvg: ind.socialEnergyAvg,
      calmModeMinutes: ind.calmModeMinutes,
      messagesSent: ind.messagesSent,
      messagesReceived: ind.messagesReceived,
    }));
  }

  async getMemberAlerts(
    parentAccountId: string,
    memberUserId: string,
  ): Promise<ParentAlertResponse[]> {
    await this.verifyParentAccess(parentAccountId, memberUserId);

    const alerts = await this.prisma.parentAlert.findMany({
      where: { parentAccountId, memberUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return alerts.map((alert) => ({
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
    alertId: string,
  ): Promise<ParentAlertResponse> {
    await this.verifyParentAccess(parentAccountId, memberUserId);

    const alert = await this.prisma.parentAlert.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    if (alert.parentAccountId !== parentAccountId) {
      throw new ForbiddenException('Not authorized to access this alert');
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

  private async verifyParentAccess(
    parentAccountId: string,
    memberUserId: string,
  ): Promise<void> {
    // Look up the member's account ID from their user ID
    const memberUser = await this.prisma.user.findUnique({
      where: { id: memberUserId },
      select: { accountId: true },
    });

    if (!memberUser) {
      throw new NotFoundException('Member not found');
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
      throw new ForbiddenException(
        'Not authorized to access this member',
      );
    }
  }
}
