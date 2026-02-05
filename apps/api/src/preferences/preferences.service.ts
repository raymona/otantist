import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateCommunicationPrefsDto,
  CommunicationPrefsResponse,
  UpdateSensoryPrefsDto,
  SensoryPrefsResponse,
  UpdateTimeBoundariesDto,
  TimeBoundaryResponse,
  UpdateConversationStartersDto,
  ConversationStartersResponse,
} from './dto';

@Injectable()
export class PreferencesService {
  constructor(private prisma: PrismaService) {}

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

  // ============================================
  // Communication Preferences
  // ============================================

  async getCommunicationPrefs(accountId: string): Promise<CommunicationPrefsResponse> {
    const userId = await this.getUserId(accountId);

    const prefs = await this.prisma.communicationPreference.findUnique({
      where: { userId },
    });

    return {
      commModes: prefs?.commModes ?? [],
      preferredTone: prefs?.preferredTone ?? null,
      slowRepliesOk: prefs?.slowRepliesOk ?? null,
      oneMessageAtTime: prefs?.oneMessageAtTime ?? null,
      readWithoutReply: prefs?.readWithoutReply ?? null,
      sectionComplete: prefs?.sectionComplete ?? false,
    };
  }

  async updateCommunicationPrefs(
    accountId: string,
    data: UpdateCommunicationPrefsDto,
  ): Promise<CommunicationPrefsResponse> {
    const userId = await this.getUserId(accountId);

    await this.prisma.communicationPreference.upsert({
      where: { userId },
      create: {
        userId,
        commModes: data.commModes ?? [],
        preferredTone: data.preferredTone,
        slowRepliesOk: data.slowRepliesOk,
        oneMessageAtTime: data.oneMessageAtTime,
        readWithoutReply: data.readWithoutReply,
        sectionComplete: data.sectionComplete ?? false,
      },
      update: {
        ...(data.commModes !== undefined && { commModes: data.commModes }),
        ...(data.preferredTone !== undefined && { preferredTone: data.preferredTone }),
        ...(data.slowRepliesOk !== undefined && { slowRepliesOk: data.slowRepliesOk }),
        ...(data.oneMessageAtTime !== undefined && { oneMessageAtTime: data.oneMessageAtTime }),
        ...(data.readWithoutReply !== undefined && { readWithoutReply: data.readWithoutReply }),
        ...(data.sectionComplete !== undefined && { sectionComplete: data.sectionComplete }),
      },
    });

    if (data.sectionComplete) {
      await this.updateOnboardingProgress(userId);
    }

    return this.getCommunicationPrefs(accountId);
  }

  // ============================================
  // Sensory Preferences
  // ============================================

  async getSensoryPrefs(accountId: string): Promise<SensoryPrefsResponse> {
    const userId = await this.getUserId(accountId);

    const prefs = await this.prisma.sensoryPreference.findUnique({
      where: { userId },
    });

    return {
      enableAnimations: prefs?.enableAnimations ?? false,
      colorIntensity: prefs?.colorIntensity ?? null,
      soundEnabled: prefs?.soundEnabled ?? false,
      notificationLimit: prefs?.notificationLimit ?? null,
      notificationGrouped: prefs?.notificationGrouped ?? true,
      sectionComplete: prefs?.sectionComplete ?? false,
    };
  }

  async updateSensoryPrefs(
    accountId: string,
    data: UpdateSensoryPrefsDto,
  ): Promise<SensoryPrefsResponse> {
    const userId = await this.getUserId(accountId);

    await this.prisma.sensoryPreference.upsert({
      where: { userId },
      create: {
        userId,
        enableAnimations: data.enableAnimations ?? false,
        colorIntensity: data.colorIntensity,
        soundEnabled: data.soundEnabled ?? false,
        notificationLimit: data.notificationLimit,
        notificationGrouped: data.notificationGrouped ?? true,
        sectionComplete: data.sectionComplete ?? false,
      },
      update: {
        ...(data.enableAnimations !== undefined && { enableAnimations: data.enableAnimations }),
        ...(data.colorIntensity !== undefined && { colorIntensity: data.colorIntensity }),
        ...(data.soundEnabled !== undefined && { soundEnabled: data.soundEnabled }),
        ...(data.notificationLimit !== undefined && { notificationLimit: data.notificationLimit }),
        ...(data.notificationGrouped !== undefined && { notificationGrouped: data.notificationGrouped }),
        ...(data.sectionComplete !== undefined && { sectionComplete: data.sectionComplete }),
      },
    });

    if (data.sectionComplete) {
      await this.updateOnboardingProgress(userId);
    }

    return this.getSensoryPrefs(accountId);
  }

  // ============================================
  // Time Boundaries
  // ============================================

  async getTimeBoundaries(accountId: string): Promise<TimeBoundaryResponse[]> {
    const userId = await this.getUserId(accountId);

    const boundaries = await this.prisma.timeBoundary.findMany({
      where: { userId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return boundaries.map((b) => ({
      dayOfWeek: b.dayOfWeek,
      availableStart: b.availableStart,
      availableEnd: b.availableEnd,
      timezone: b.timezone,
    }));
  }

  async updateTimeBoundaries(
    accountId: string,
    data: UpdateTimeBoundariesDto,
  ): Promise<TimeBoundaryResponse[]> {
    const userId = await this.getUserId(accountId);

    // Replace all boundaries in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete existing boundaries
      await tx.timeBoundary.deleteMany({
        where: { userId },
      });

      // Create new boundaries
      if (data.boundaries.length > 0) {
        await tx.timeBoundary.createMany({
          data: data.boundaries.map((b) => ({
            userId,
            dayOfWeek: b.dayOfWeek,
            availableStart: b.availableStart,
            availableEnd: b.availableEnd,
            timezone: b.timezone ?? 'America/Montreal',
          })),
        });
      }
    });

    return this.getTimeBoundaries(accountId);
  }

  // ============================================
  // Conversation Starters
  // ============================================

  async getConversationStarters(accountId: string): Promise<ConversationStartersResponse> {
    const userId = await this.getUserId(accountId);

    const starters = await this.prisma.conversationStarter.findUnique({
      where: { userId },
    });

    return {
      goodTopics: starters?.goodTopics ?? [],
      avoidTopics: starters?.avoidTopics ?? [],
      interactionTips: starters?.interactionTips ?? [],
      sectionComplete: starters?.sectionComplete ?? false,
    };
  }

  async updateConversationStarters(
    accountId: string,
    data: UpdateConversationStartersDto,
  ): Promise<ConversationStartersResponse> {
    const userId = await this.getUserId(accountId);

    await this.prisma.conversationStarter.upsert({
      where: { userId },
      create: {
        userId,
        goodTopics: data.goodTopics ?? [],
        avoidTopics: data.avoidTopics ?? [],
        interactionTips: data.interactionTips ?? [],
        sectionComplete: data.sectionComplete ?? false,
      },
      update: {
        ...(data.goodTopics !== undefined && { goodTopics: data.goodTopics }),
        ...(data.avoidTopics !== undefined && { avoidTopics: data.avoidTopics }),
        ...(data.interactionTips !== undefined && { interactionTips: data.interactionTips }),
        ...(data.sectionComplete !== undefined && { sectionComplete: data.sectionComplete }),
      },
    });

    if (data.sectionComplete) {
      await this.updateOnboardingProgress(userId);
    }

    return this.getConversationStarters(accountId);
  }

  // ============================================
  // Onboarding Progress Helper
  // ============================================

  private async updateOnboardingProgress(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        account: true,
        communicationPrefs: true,
        sensoryPrefs: true,
        conversationStarters: true,
      },
    });

    if (!user) return;

    const account = user.account;

    // Determine current onboarding step
    let currentStep: string | null = null;
    let onboardingComplete = false;

    if (!account.emailVerified) {
      currentStep = 'email_verification';
    } else if (!account.legalAcceptedAt) {
      currentStep = 'legal_acceptance';
    } else if (!user.displayName || !user.ageGroup) {
      currentStep = 'basic_profile';
    } else if (!user.communicationPrefs?.sectionComplete) {
      currentStep = 'communication_preferences';
    } else if (!user.sensoryPrefs?.sectionComplete) {
      currentStep = 'sensory_preferences';
    } else if (!user.conversationStarters?.sectionComplete) {
      currentStep = 'conversation_starters';
    } else {
      currentStep = null;
      onboardingComplete = true;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: currentStep,
        onboardingComplete,
      },
    });
  }
}
