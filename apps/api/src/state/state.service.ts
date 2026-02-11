import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { SocialEnergyLevel, UserStateResponse, CalmModeResponse } from './dto';

@Injectable()
export class StateService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  private async getUserId(accountId: string): Promise<string> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true },
    });

    if (!account?.user) {
      throw new NotFoundException('User not found');
    }

    return account.user.id;
  }

  private async ensureUserState(userId: string): Promise<void> {
    const existing = await this.prisma.userState.findUnique({
      where: { userId },
    });

    if (!existing) {
      await this.prisma.userState.create({
        data: { userId },
      });
    }
  }

  async getCurrentState(accountId: string): Promise<UserStateResponse> {
    const userId = await this.getUserId(accountId);
    await this.ensureUserState(userId);

    const state = await this.prisma.userState.findUnique({
      where: { userId },
    });

    return {
      socialEnergy: state?.socialEnergy ?? null,
      energyUpdatedAt: state?.energyUpdatedAt ?? null,
      calmModeActive: state?.calmModeActive ?? false,
      calmModeStarted: state?.calmModeStarted ?? null,
      isOnline: state?.isOnline ?? false,
      lastSeen: state?.lastSeen ?? null,
    };
  }

  async updateSocialEnergy(
    accountId: string,
    level: SocialEnergyLevel
  ): Promise<UserStateResponse> {
    const userId = await this.getUserId(accountId);
    await this.ensureUserState(userId);

    await this.prisma.userState.update({
      where: { userId },
      data: {
        socialEnergy: level,
        energyUpdatedAt: new Date(),
      },
    });

    this.eventEmitter.emit('user.state.changed', {
      userId,
      socialEnergy: level,
    });

    return this.getCurrentState(accountId);
  }

  async activateCalmMode(accountId: string): Promise<CalmModeResponse> {
    const userId = await this.getUserId(accountId);
    await this.ensureUserState(userId);

    const now = new Date();

    await this.prisma.userState.update({
      where: { userId },
      data: {
        calmModeActive: true,
        calmModeStarted: now,
      },
    });

    // Check if this is a parent-managed account and create alert
    await this.createParentAlertIfManaged(accountId, userId, 'calm_mode_activated');

    this.eventEmitter.emit('user.state.changed', {
      userId,
      calmModeActive: true,
    });

    return {
      active: true,
      startedAt: now,
      durationMinutes: 0,
    };
  }

  async deactivateCalmMode(accountId: string): Promise<CalmModeResponse> {
    const userId = await this.getUserId(accountId);
    await this.ensureUserState(userId);

    const state = await this.prisma.userState.findUnique({
      where: { userId },
    });

    // Calculate duration for member indicators
    let durationMinutes = 0;
    if (state?.calmModeStarted) {
      durationMinutes = Math.floor((Date.now() - state.calmModeStarted.getTime()) / (1000 * 60));

      // Update member indicators for parent dashboard
      await this.updateMemberIndicators(userId, durationMinutes);
    }

    await this.prisma.userState.update({
      where: { userId },
      data: {
        calmModeActive: false,
        calmModeStarted: null,
      },
    });

    this.eventEmitter.emit('user.state.changed', {
      userId,
      calmModeActive: false,
    });

    // Trigger delivery of calm-mode-queued messages
    this.eventEmitter.emit('calm_mode.deactivated', { userId });

    return {
      active: false,
      startedAt: null,
      durationMinutes,
    };
  }

  private async createParentAlertIfManaged(
    accountId: string,
    userId: string,
    alertType: 'calm_mode_activated' | 'prolonged_calm_mode'
  ): Promise<void> {
    // Check if this account is managed by a parent
    const managedRelation = await this.prisma.parentManagedAccount.findFirst({
      where: {
        memberAccountId: accountId,
        status: 'active',
      },
    });

    if (!managedRelation) return;

    const alertMessages = {
      calm_mode_activated: {
        fr: 'Le mode calme a été activé',
        en: 'Calm mode has been activated',
      },
      prolonged_calm_mode: {
        fr: 'Le mode calme est actif depuis plus de 2 heures',
        en: 'Calm mode has been active for more than 2 hours',
      },
    };

    await this.prisma.parentAlert.create({
      data: {
        parentAccountId: managedRelation.parentAccountId,
        memberUserId: userId,
        alertType: alertType === 'calm_mode_activated' ? 'stress_indicator' : 'prolonged_calm_mode',
        severity: alertType === 'calm_mode_activated' ? 'info' : 'warning',
        messageFr: alertMessages[alertType].fr,
        messageEn: alertMessages[alertType].en,
      },
    });
  }

  private async updateMemberIndicators(userId: string, calmModeMinutes: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.memberIndicator.upsert({
      where: {
        userId_recordedAt: {
          userId,
          recordedAt: today,
        },
      },
      create: {
        userId,
        recordedAt: today,
        calmModeMinutes,
      },
      update: {
        calmModeMinutes: {
          increment: calmModeMinutes,
        },
      },
    });
  }

  // Called when user connects/disconnects (for Socket.io later)
  async updateOnlineStatus(accountId: string, isOnline: boolean): Promise<void> {
    const userId = await this.getUserId(accountId);
    await this.ensureUserState(userId);

    await this.prisma.userState.update({
      where: { userId },
      data: {
        isOnline,
        lastSeen: isOnline ? null : new Date(),
      },
    });
  }
}
