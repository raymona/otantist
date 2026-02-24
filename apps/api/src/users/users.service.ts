import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileDto,
  UserProfileResponse,
  OnboardingStatusResponse,
  HowToTalkToMeResponse,
  UserDirectoryResponse,
} from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(accountId: string): Promise<UserProfileResponse> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: true,
        parentManagedAsParent: { where: { status: 'active' }, take: 1 },
      },
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
      isParent: account.parentManagedAsParent.length > 0,
      isModerator: account.accountType === 'moderator',
      createdAt: account.createdAt,
    };
  }

  async updateProfile(accountId: string, data: UpdateProfileDto): Promise<UserProfileResponse> {
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

  async updateLanguage(accountId: string, language: 'fr' | 'en'): Promise<{ language: string }> {
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
    targetUserId: string
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
        targetUser.id
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

  async getDirectory(accountId: string, search?: string): Promise<UserDirectoryResponse> {
    // Get the requesting user's ID and account type
    const requestingAccount = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { user: true },
    });

    if (!requestingAccount?.user) {
      throw new NotFoundException('User not found');
    }

    const requestingUserId = requestingAccount.user.id;
    const requesterIsManaged = requestingAccount.accountType === 'parent_managed';

    // Get IDs of users blocked by or blocking the requesting user
    const blocks = await this.prisma.blockedUser.findMany({
      where: {
        OR: [{ blockerId: requestingUserId }, { blockedId: requestingUserId }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const blockedUserIds = new Set<string>();
    for (const block of blocks) {
      blockedUserIds.add(block.blockerId);
      blockedUserIds.add(block.blockedId);
    }
    blockedUserIds.delete(requestingUserId);

    // Build where clause
    // parent_managed (minor) accounts are always excluded from results for adult users.
    // When the requester is themselves parent_managed, only show other parent_managed
    // accounts — adults are never visible to minors in the directory.
    const where: any = {
      onboardingComplete: true,
      profileVisibility: { not: 'hidden' },
      id: { notIn: [requestingUserId, ...blockedUserIds] },
      account: {
        accountType: requesterIsManaged
          ? 'parent_managed'
          : { notIn: ['parent_managed', 'moderator'] },
      },
    };

    if (search?.trim()) {
      where.displayName = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      include: { state: true },
      orderBy: { displayName: 'asc' },
    });

    return {
      users: users.map(user => ({
        id: user.id,
        displayName: user.displayName,
        isOnline: user.state?.isOnline ?? false,
        lastSeen: user.state?.lastSeen?.toISOString() ?? null,
        socialEnergy: user.state?.socialEnergy ?? null,
        calmModeActive: user.state?.calmModeActive ?? false,
      })),
      total: users.length,
    };
  }

  private async hasActiveConversation(
    userId1: string | undefined,
    userId2: string
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

  async updateOnboardingProgress(userId: string): Promise<void> {
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
