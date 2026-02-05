import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileDto,
  UserProfileResponse,
  OnboardingStatusResponse,
  HowToTalkToMeResponse,
} from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(accountId: string): Promise<UserProfileResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true },
    });

    if (!account || !account.user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: account.user.id,
      accountId: account.id,
      displayName: account.user.displayName,
      ageGroup: account.user.ageGroup,
      profileVisibility: account.user.profileVisibility,
      onboardingComplete: account.user.onboardingComplete,
      onboardingStep: account.user.onboardingStep,
      email: account.email,
      language: account.preferredLanguage,
      emailVerified: account.emailVerified,
      legalAccepted: !!account.legalAcceptedAt,
      createdAt: account.createdAt,
    };
  }

  async updateProfile(
    accountId: string,
    data: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true },
    });

    if (!account || !account.user) {
      throw new NotFoundException('User not found');
    }

    // Update user profile
    await this.prisma.user.update({
      where: { id: account.user.id },
      data: {
        displayName: data.displayName,
        ageGroup: data.ageGroup,
        profileVisibility: data.profileVisibility,
      },
    });

    // Check if basic profile is now complete and update onboarding step
    if (data.displayName && data.ageGroup) {
      await this.updateOnboardingProgress(account.user.id);
    }

    return this.getProfile(accountId);
  }

  async updateLanguage(
    accountId: string,
    language: 'fr' | 'en',
  ): Promise<{ language: string }> {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { preferredLanguage: language },
    });

    return { language };
  }

  async getOnboardingStatus(accountId: string): Promise<OnboardingStatusResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          include: {
            communicationPrefs: true,
            sensoryPrefs: true,
            conversationStarters: true,
          },
        },
      },
    });

    if (!account || !account.user) {
      throw new NotFoundException('User not found');
    }

    const user = account.user;

    const steps = {
      emailVerified: account.emailVerified,
      legalAccepted: !!account.legalAcceptedAt,
      basicProfile: !!(user.displayName && user.ageGroup),
      communicationPrefs: user.communicationPrefs?.sectionComplete ?? false,
      sensoryPrefs: user.sensoryPrefs?.sectionComplete ?? false,
      conversationStarters: user.conversationStarters?.sectionComplete ?? false,
    };

    return {
      complete: user.onboardingComplete,
      currentStep: user.onboardingStep,
      steps,
    };
  }

  async getHowToTalkToMe(
    requestingAccountId: string,
    targetUserId: string,
  ): Promise<HowToTalkToMeResponse> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        account: true,
        communicationPrefs: true,
        conversationStarters: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if requesting user is blocked by target
    const requestingAccount = await this.prisma.account.findUnique({
      where: { id: requestingAccountId },
      include: { user: true },
    });

    if (requestingAccount?.user) {
      const isBlocked = await this.prisma.blockedUser.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: targetUser.id,
            blockedId: requestingAccount.user.id,
          },
        },
      });

      if (isBlocked) {
        throw new ForbiddenException('Cannot view this profile');
      }
    }

    // Check profile visibility
    if (targetUser.profileVisibility === 'hidden') {
      // Only allow if they have an active conversation
      const hasConversation = await this.hasActiveConversation(
        requestingAccount?.user?.id,
        targetUser.id,
      );
      if (!hasConversation) {
        throw new ForbiddenException('This profile is hidden');
      }
    }

    return {
      displayName: targetUser.displayName,
      preferredTone: targetUser.communicationPrefs?.preferredTone,
      commModes: targetUser.communicationPrefs?.commModes ?? [],
      slowRepliesOk: targetUser.communicationPrefs?.slowRepliesOk,
      oneMessageAtTime: targetUser.communicationPrefs?.oneMessageAtTime,
      readWithoutReply: targetUser.communicationPrefs?.readWithoutReply,
      goodTopics: targetUser.conversationStarters?.goodTopics ?? [],
      avoidTopics: targetUser.conversationStarters?.avoidTopics ?? [],
      interactionTips: targetUser.conversationStarters?.interactionTips ?? [],
    };
  }

  private async hasActiveConversation(
    userId1: string | undefined,
    userId2: string,
  ): Promise<boolean> {
    if (!userId1) return false;

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: userId1, userBId: userId2 },
          { userAId: userId2, userBId: userId1 },
        ],
        status: 'active',
      },
    });

    return !!conversation;
  }

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
