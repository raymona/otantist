import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.memberIndicator.deleteMany();
  await prisma.parentAlert.deleteMany();
  await prisma.userReport.deleteMany();
  await prisma.moderationQueue.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.messageDeletion.deleteMany();
  await prisma.conversationHidden.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.userState.deleteMany();
  await prisma.sensoryPreference.deleteMany();
  await prisma.conversationStarter.deleteMany();
  await prisma.timeBoundary.deleteMany();
  await prisma.communicationPreference.deleteMany();
  await prisma.parentManagedAccount.deleteMany();
  await prisma.user.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.account.deleteMany();

  // ─────────────────────────────────────────
  // Invite codes
  // ─────────────────────────────────────────
  console.log('Creating invite codes...');
  await prisma.inviteCode.createMany({
    data: [
      { code: 'BETA2024', maxUses: 100, currentUses: 0 },
      { code: 'TESTCODE', maxUses: 10, currentUses: 0 },
    ],
  });
  console.log('  ✓ Created 2 invite codes');

  // ─────────────────────────────────────────
  // Accounts & users
  // ─────────────────────────────────────────
  console.log('Creating test users...');
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  const hoursAgo = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000);
  const minsAgo = (n: number) => new Date(now.getTime() - n * 60 * 1000);

  // Marie — adult, French, fully onboarded
  const marieAccount = await prisma.account.create({
    data: {
      email: 'marie@test.com',
      passwordHash,
      accountType: 'adult',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'fr',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: daysAgo(30),
    },
  });
  const marie = await prisma.user.create({
    data: {
      accountId: marieAccount.id,
      displayName: 'Marie',
      ageGroup: 'age_26_40',
      profileVisibility: 'visible',
      onboardingComplete: true,
    },
  });

  // Alex — adult, English, fully onboarded
  const alexAccount = await prisma.account.create({
    data: {
      email: 'alex@test.com',
      passwordHash,
      accountType: 'adult',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'en',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: daysAgo(25),
    },
  });
  const alex = await prisma.user.create({
    data: {
      accountId: alexAccount.id,
      displayName: 'Alex',
      ageGroup: 'age_18_25',
      profileVisibility: 'visible',
      onboardingComplete: true,
    },
  });

  // Sam — adult, English, partially onboarded (stopped at sensory)
  const samAccount = await prisma.account.create({
    data: {
      email: 'sam@test.com',
      passwordHash,
      accountType: 'adult',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'en',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: daysAgo(20),
    },
  });
  const sam = await prisma.user.create({
    data: {
      accountId: samAccount.id,
      displayName: 'Sam',
      ageGroup: 'age_18_25',
      profileVisibility: 'visible',
      onboardingComplete: false,
      onboardingStep: 'sensory_preferences',
    },
  });

  // Jordan — adult, English, fully onboarded (extra user for conversations)
  const jordanAccount = await prisma.account.create({
    data: {
      email: 'jordan@test.com',
      passwordHash,
      accountType: 'adult',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'en',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: daysAgo(15),
    },
  });
  const jordan = await prisma.user.create({
    data: {
      accountId: jordanAccount.id,
      displayName: 'Jordan',
      ageGroup: 'age_26_40',
      profileVisibility: 'visible',
      onboardingComplete: true,
    },
  });

  // Moderator account
  const modAccount = await prisma.account.create({
    data: {
      email: 'mod@test.com',
      passwordHash,
      accountType: 'moderator',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'fr',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: daysAgo(30),
    },
  });
  await prisma.user.create({
    data: {
      accountId: modAccount.id,
      displayName: 'Modérateur',
      ageGroup: 'age_26_40',
      profileVisibility: 'hidden',
      onboardingComplete: true,
    },
  });

  // Parent account
  const parentAccount = await prisma.account.create({
    data: {
      email: 'parent@test.com',
      passwordHash,
      accountType: 'adult',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'fr',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: daysAgo(30),
    },
  });
  const parentUser = await prisma.user.create({
    data: {
      accountId: parentAccount.id,
      displayName: 'Parent Test',
      ageGroup: 'age_40_plus',
      profileVisibility: 'hidden',
      onboardingComplete: true,
    },
  });

  // Minor (parent-managed) — Léo
  const minorAccount = await prisma.account.create({
    data: {
      email: 'minor@test.com',
      passwordHash,
      accountType: 'parent_managed',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'fr',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: daysAgo(30),
    },
  });
  const minor = await prisma.user.create({
    data: {
      accountId: minorAccount.id,
      displayName: 'Léo',
      ageGroup: 'age_14_17',
      profileVisibility: 'visible',
      onboardingComplete: true,
    },
  });

  // Parent-child relationship
  await prisma.parentManagedAccount.create({
    data: {
      parentAccountId: parentAccount.id,
      memberAccountId: minorAccount.id,
      relationship: 'parent',
      status: 'active',
      consentGivenAt: daysAgo(30),
    },
  });

  console.log('  ✓ Created 7 test users');

  // ─────────────────────────────────────────
  // Communication preferences
  // ─────────────────────────────────────────
  console.log('Creating communication preferences...');
  await prisma.communicationPreference.createMany({
    data: [
      {
        userId: marie.id,
        commModes: ['text', 'emoji'],
        preferredTone: 'gentle',
        slowRepliesOk: true,
        oneMessageAtTime: true,
        readWithoutReply: true,
        sectionComplete: true,
      },
      {
        userId: alex.id,
        commModes: ['text'],
        preferredTone: 'direct',
        slowRepliesOk: true,
        oneMessageAtTime: false,
        readWithoutReply: true,
        sectionComplete: true,
      },
      {
        userId: jordan.id,
        commModes: ['text', 'emoji'],
        preferredTone: 'enthusiastic',
        slowRepliesOk: false,
        oneMessageAtTime: false,
        readWithoutReply: true,
        sectionComplete: true,
      },
      {
        userId: minor.id,
        commModes: ['text', 'emoji'],
        preferredTone: 'enthusiastic',
        slowRepliesOk: true,
        oneMessageAtTime: true,
        readWithoutReply: false,
        sectionComplete: true,
      },
      {
        userId: parentUser.id,
        commModes: ['text'],
        preferredTone: 'gentle',
        slowRepliesOk: true,
        oneMessageAtTime: true,
        readWithoutReply: true,
        sectionComplete: true,
      },
    ],
  });
  console.log('  ✓ Created communication preferences');

  // ─────────────────────────────────────────
  // Conversation starters
  // ─────────────────────────────────────────
  console.log('Creating conversation starters...');
  await prisma.conversationStarter.createMany({
    data: [
      {
        userId: marie.id,
        goodTopics: ['art', 'nature', 'books', 'cooking', 'watercolors'],
        avoidTopics: ['politics', 'loud events', 'crowds'],
        interactionTips: [
          'I need time to respond',
          'Please be patient with me',
          'One topic at a time',
        ],
        sectionComplete: true,
      },
      {
        userId: alex.id,
        goodTopics: ['video games', 'programming', 'music', 'linux', 'sci-fi'],
        avoidTopics: ['sports', 'small talk', 'phone calls'],
        interactionTips: [
          'I prefer direct communication',
          'No need for pleasantries',
          "I read every message even if I don't reply right away",
        ],
        sectionComplete: true,
      },
      {
        userId: jordan.id,
        goodTopics: ['hiking', 'photography', 'coffee', 'cats', 'film'],
        avoidTopics: ['conflict', 'news', 'deadlines'],
        interactionTips: ['I reply fastest in the evenings', 'Feel free to send multiple messages'],
        sectionComplete: true,
      },
      {
        userId: minor.id,
        goodTopics: ['minecraft', 'animals', 'drawing', 'lego', 'cartoons'],
        avoidTopics: ['school stress', 'loud noises', 'social drama'],
        interactionTips: [
          'I like emoji!',
          'Short messages please',
          'I might take a while to respond',
        ],
        sectionComplete: true,
      },
    ],
  });
  console.log('  ✓ Created conversation starters');

  // ─────────────────────────────────────────
  // Sensory preferences
  // ─────────────────────────────────────────
  console.log('Creating sensory preferences...');
  await prisma.sensoryPreference.createMany({
    data: [
      {
        userId: marie.id,
        enableAnimations: false,
        colorIntensity: 'reduced',
        soundEnabled: false,
        notificationLimit: 5,
        notificationGrouped: true,
        sectionComplete: true,
      },
      {
        userId: alex.id,
        enableAnimations: true,
        colorIntensity: 'standard',
        soundEnabled: true,
        notificationLimit: null,
        notificationGrouped: false,
        sectionComplete: true,
      },
      {
        userId: jordan.id,
        enableAnimations: true,
        colorIntensity: 'standard',
        soundEnabled: false,
        notificationLimit: 10,
        notificationGrouped: true,
        sectionComplete: true,
      },
      {
        userId: minor.id,
        enableAnimations: false,
        colorIntensity: 'minimal',
        soundEnabled: false,
        notificationLimit: 3,
        notificationGrouped: true,
        sectionComplete: true,
      },
    ],
  });
  console.log('  ✓ Created sensory preferences');

  // ─────────────────────────────────────────
  // Time boundaries
  // ─────────────────────────────────────────
  console.log('Creating time boundaries...');
  // Marie: weekdays 9am–9pm, weekends 10am–6pm
  for (let day = 1; day <= 5; day++) {
    await prisma.timeBoundary.create({
      data: {
        userId: marie.id,
        dayOfWeek: day,
        availableStart: '09:00',
        availableEnd: '21:00',
        timezone: 'America/Montreal',
      },
    });
  }
  for (const day of [0, 6]) {
    await prisma.timeBoundary.create({
      data: {
        userId: marie.id,
        dayOfWeek: day,
        availableStart: '10:00',
        availableEnd: '18:00',
        timezone: 'America/Montreal',
      },
    });
  }
  // Alex: evenings only, all days 6pm–11pm
  for (let day = 0; day <= 6; day++) {
    await prisma.timeBoundary.create({
      data: {
        userId: alex.id,
        dayOfWeek: day,
        availableStart: '18:00',
        availableEnd: '23:00',
        timezone: 'America/Montreal',
      },
    });
  }
  console.log('  ✓ Created time boundaries');

  // ─────────────────────────────────────────
  // User states
  // ─────────────────────────────────────────
  console.log('Creating user states...');
  await prisma.userState.createMany({
    data: [
      {
        userId: marie.id,
        socialEnergy: 'medium',
        energyUpdatedAt: hoursAgo(2),
        calmModeActive: false,
        isOnline: false,
        lastSeen: hoursAgo(1),
      },
      {
        userId: alex.id,
        socialEnergy: 'high',
        energyUpdatedAt: minsAgo(30),
        calmModeActive: false,
        isOnline: true,
        lastSeen: now,
      },
      {
        userId: sam.id,
        socialEnergy: 'low',
        energyUpdatedAt: hoursAgo(5),
        calmModeActive: false,
        isOnline: false,
        lastSeen: hoursAgo(5),
      },
      {
        userId: jordan.id,
        socialEnergy: 'medium',
        energyUpdatedAt: hoursAgo(1),
        calmModeActive: false,
        isOnline: true,
        lastSeen: now,
      },
      {
        userId: minor.id,
        socialEnergy: 'low',
        energyUpdatedAt: minsAgo(45),
        calmModeActive: true,
        calmModeStarted: minsAgo(45),
        isOnline: true,
        lastSeen: now,
      },
    ],
  });
  console.log('  ✓ Created user states');

  // ─────────────────────────────────────────
  // Conversations & messages
  // ─────────────────────────────────────────
  console.log('Creating conversations and messages...');

  // ── Conversation 1: Marie ↔ Alex (active, long history)
  const convMarieAlex = await prisma.conversation.create({
    data: { userAId: marie.id, userBId: alex.id, status: 'active' },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: convMarieAlex.id,
        senderId: alex.id,
        content: 'Salut Marie! I saw you like art. What kind do you create?',
        status: 'read',
        createdAt: daysAgo(3),
        deliveredAt: daysAgo(3),
        readAt: daysAgo(3),
      },
      {
        conversationId: convMarieAlex.id,
        senderId: marie.id,
        content: 'Bonjour Alex! I mostly do watercolors. Nature scenes. 🎨',
        status: 'read',
        createdAt: new Date(daysAgo(3).getTime() + 2 * 60 * 60 * 1000),
        deliveredAt: new Date(daysAgo(3).getTime() + 2 * 60 * 60 * 1000),
        readAt: new Date(daysAgo(3).getTime() + 3 * 60 * 60 * 1000),
      },
      {
        conversationId: convMarieAlex.id,
        senderId: alex.id,
        content:
          "That's really cool! I've always wanted to try painting but I'm better with digital art.",
        status: 'read',
        createdAt: daysAgo(2),
        deliveredAt: daysAgo(2),
        readAt: daysAgo(2),
      },
      {
        conversationId: convMarieAlex.id,
        senderId: marie.id,
        content: 'Digital art is beautiful too. Do you have a favourite tool?',
        status: 'read',
        createdAt: new Date(daysAgo(2).getTime() + 4 * 60 * 60 * 1000),
        deliveredAt: new Date(daysAgo(2).getTime() + 4 * 60 * 60 * 1000),
        readAt: new Date(daysAgo(2).getTime() + 5 * 60 * 60 * 1000),
      },
      {
        conversationId: convMarieAlex.id,
        senderId: alex.id,
        content:
          'Mostly Procreate on iPad. It feels closest to traditional media without the mess 😄',
        status: 'read',
        createdAt: daysAgo(1),
        deliveredAt: daysAgo(1),
        readAt: daysAgo(1),
      },
      {
        conversationId: convMarieAlex.id,
        senderId: marie.id,
        content: 'Ha! I understand. Cleaning brushes is the least fun part of watercolor.',
        status: 'read',
        createdAt: new Date(daysAgo(1).getTime() + 1 * 60 * 60 * 1000),
        deliveredAt: new Date(daysAgo(1).getTime() + 1 * 60 * 60 * 1000),
        readAt: new Date(daysAgo(1).getTime() + 2 * 60 * 60 * 1000),
      },
      {
        conversationId: convMarieAlex.id,
        senderId: alex.id,
        content: 'Are you working on anything right now?',
        status: 'delivered',
        createdAt: hoursAgo(3),
        deliveredAt: hoursAgo(3),
      },
    ],
  });

  // ── Conversation 2: Alex ↔ Sam (active, Sam is quiet)
  const convAlexSam = await prisma.conversation.create({
    data: { userAId: alex.id, userBId: sam.id, status: 'active' },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: convAlexSam.id,
        senderId: alex.id,
        content: "Hey Sam! I heard you're into programming too?",
        status: 'read',
        createdAt: daysAgo(5),
        deliveredAt: daysAgo(5),
        readAt: daysAgo(5),
      },
      {
        conversationId: convAlexSam.id,
        senderId: sam.id,
        content: 'Yeah, mostly Python for data stuff. You?',
        status: 'read',
        createdAt: new Date(daysAgo(5).getTime() + 6 * 60 * 60 * 1000),
        deliveredAt: new Date(daysAgo(5).getTime() + 6 * 60 * 60 * 1000),
        readAt: new Date(daysAgo(5).getTime() + 7 * 60 * 60 * 1000),
      },
      {
        conversationId: convAlexSam.id,
        senderId: alex.id,
        content: 'TypeScript mostly. Some Rust when I want to feel smart 😅',
        status: 'read',
        createdAt: daysAgo(4),
        deliveredAt: daysAgo(4),
        readAt: daysAgo(4),
      },
      {
        conversationId: convAlexSam.id,
        senderId: alex.id,
        content:
          "I've been meaning to ask — have you tried any neurodivergent-friendly productivity tools?",
        status: 'read',
        createdAt: daysAgo(2),
        deliveredAt: daysAgo(2),
        readAt: daysAgo(2),
      },
      {
        conversationId: convAlexSam.id,
        senderId: sam.id,
        content: 'Not really... I kind of just wing it and hope for the best lol',
        status: 'read',
        createdAt: new Date(daysAgo(2).getTime() + 3 * 60 * 60 * 1000),
        deliveredAt: new Date(daysAgo(2).getTime() + 3 * 60 * 60 * 1000),
        readAt: new Date(daysAgo(2).getTime() + 4 * 60 * 60 * 1000),
      },
      {
        conversationId: convAlexSam.id,
        senderId: alex.id,
        content: 'Fair enough. Anyway, good talking to you',
        status: 'delivered',
        createdAt: hoursAgo(8),
        deliveredAt: hoursAgo(8),
      },
    ],
  });

  // ── Conversation 3: Marie ↔ Jordan (active, recent and warm)
  const convMarieJordan = await prisma.conversation.create({
    data: { userAId: marie.id, userBId: jordan.id, status: 'active' },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: convMarieJordan.id,
        senderId: jordan.id,
        content: 'Hi Marie! I love your profile — nature and watercolors, very calming 🌿',
        status: 'read',
        createdAt: daysAgo(1),
        deliveredAt: daysAgo(1),
        readAt: daysAgo(1),
      },
      {
        conversationId: convMarieJordan.id,
        senderId: marie.id,
        content:
          'Thank you so much, that means a lot! I saw you like photography — landscape or portrait?',
        status: 'read',
        createdAt: new Date(daysAgo(1).getTime() + 2 * 60 * 60 * 1000),
        deliveredAt: new Date(daysAgo(1).getTime() + 2 * 60 * 60 * 1000),
        readAt: new Date(daysAgo(1).getTime() + 3 * 60 * 60 * 1000),
      },
      {
        conversationId: convMarieJordan.id,
        senderId: jordan.id,
        content:
          'Landscape for sure. I like being alone outside anyway, and the camera gives me a reason 📸',
        status: 'read',
        createdAt: new Date(daysAgo(1).getTime() + 4 * 60 * 60 * 1000),
        deliveredAt: new Date(daysAgo(1).getTime() + 4 * 60 * 60 * 1000),
        readAt: new Date(daysAgo(1).getTime() + 5 * 60 * 60 * 1000),
      },
      {
        conversationId: convMarieJordan.id,
        senderId: marie.id,
        content: 'I completely understand that. Nature is so much easier than people sometimes.',
        status: 'read',
        createdAt: hoursAgo(5),
        deliveredAt: hoursAgo(5),
        readAt: hoursAgo(4),
      },
      {
        conversationId: convMarieJordan.id,
        senderId: jordan.id,
        content: 'Exactly!! Okay we get each other 😄',
        status: 'sent',
        createdAt: hoursAgo(1),
        deliveredAt: hoursAgo(1),
      },
    ],
  });

  // ── Conversation 4: Alex ↔ Jordan (flagged message, active)
  const convAlexJordan = await prisma.conversation.create({
    data: { userAId: alex.id, userBId: jordan.id, status: 'active' },
  });
  const flaggedMsg = await prisma.message.create({
    data: {
      conversationId: convAlexJordan.id,
      senderId: alex.id,
      content: 'You never respond fast enough. This is incredibly frustrating.',
      status: 'read',
      flagged: true,
      flaggedBy: 'ai',
      flaggedReason: 'Potentially aggressive tone detected',
      createdAt: daysAgo(2),
      deliveredAt: daysAgo(2),
      readAt: daysAgo(2),
    },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: convAlexJordan.id,
        senderId: jordan.id,
        content: "I'm sorry, I had a rough day. I'll try to be more responsive.",
        status: 'read',
        createdAt: new Date(daysAgo(2).getTime() + 1 * 60 * 60 * 1000),
        deliveredAt: new Date(daysAgo(2).getTime() + 1 * 60 * 60 * 1000),
        readAt: new Date(daysAgo(2).getTime() + 2 * 60 * 60 * 1000),
      },
      {
        conversationId: convAlexJordan.id,
        senderId: alex.id,
        content: "I'm sorry too. I shouldn't have said that.",
        status: 'delivered',
        createdAt: hoursAgo(6),
        deliveredAt: hoursAgo(6),
      },
    ],
  });

  console.log('  ✓ Created 4 conversations with messages');

  // ─────────────────────────────────────────
  // Blocked users  (Alex has blocked Sam)
  // ─────────────────────────────────────────
  console.log('Creating blocked users...');
  await prisma.blockedUser.create({
    data: { blockerId: alex.id, blockedId: sam.id, createdAt: daysAgo(1) },
  });
  console.log('  ✓ Alex has blocked Sam');

  // ─────────────────────────────────────────
  // User reports
  // ─────────────────────────────────────────
  console.log('Creating user reports...');
  const report1 = await prisma.userReport.create({
    data: {
      reporterId: jordan.id,
      reportedUserId: alex.id,
      reportedMessageId: flaggedMsg.id,
      reason: 'harassment',
      description: 'This message felt very aggressive and made me uncomfortable.',
      createdAt: daysAgo(2),
    },
  });
  const report2 = await prisma.userReport.create({
    data: {
      reporterId: marie.id,
      reportedUserId: sam.id,
      reason: 'spam',
      description: 'Received repeated unsolicited messages before blocking.',
      createdAt: daysAgo(10),
    },
  });
  console.log('  ✓ Created 2 user reports');

  // ─────────────────────────────────────────
  // Moderation queue
  // ─────────────────────────────────────────
  console.log('Creating moderation queue items...');
  await prisma.moderationQueue.createMany({
    data: [
      // Pending — urgent (from Jordan's report on Alex's flagged message)
      {
        itemType: 'message',
        itemId: flaggedMsg.id,
        flaggedBy: 'user',
        flagReason: report1.id,
        status: 'pending',
        priority: 'urgent',
        createdAt: daysAgo(2),
      },
      // Pending — high (AI-flagged, same message, second queue entry from AI)
      {
        itemType: 'message',
        itemId: flaggedMsg.id,
        flaggedBy: 'ai',
        flagReason: 'Aggressive language pattern: high confidence',
        aiConfidence: 0.87,
        status: 'pending',
        priority: 'high',
        createdAt: daysAgo(2),
      },
      // Pending — medium (user report, spam)
      {
        itemType: 'user',
        itemId: sam.id,
        flaggedBy: 'user',
        flagReason: report2.id,
        status: 'pending',
        priority: 'medium',
        createdAt: daysAgo(10),
      },
      // Pending — low (AI-flagged with low confidence)
      {
        itemType: 'message',
        itemId: convMarieAlex.id, // placeholder — real use would be message id
        flaggedBy: 'ai',
        flagReason: 'Possible distress keywords detected',
        aiConfidence: 0.31,
        status: 'pending',
        priority: 'low',
        createdAt: daysAgo(5),
      },
      // Reviewing — high
      {
        itemType: 'user',
        itemId: alex.id,
        flaggedBy: 'user',
        flagReason: 'Multiple complaints about communication style',
        status: 'reviewing',
        priority: 'high',
        createdAt: daysAgo(4),
      },
      // Reviewing — medium
      {
        itemType: 'message',
        itemId: convAlexSam.id, // placeholder
        flaggedBy: 'ai',
        flagReason: 'Message content may violate community guidelines',
        aiConfidence: 0.55,
        status: 'reviewing',
        priority: 'medium',
        createdAt: daysAgo(7),
      },
      // Resolved — dismissed
      {
        itemType: 'user',
        itemId: jordan.id,
        flaggedBy: 'ai',
        flagReason: 'Account activity anomaly',
        aiConfidence: 0.22,
        status: 'resolved',
        priority: 'low',
        actionTaken: 'dismissed',
        resolutionNotes: 'False positive — normal onboarding activity.',
        createdAt: daysAgo(14),
        resolvedAt: daysAgo(12),
      },
      // Resolved — warned
      {
        itemType: 'message',
        itemId: flaggedMsg.id,
        flaggedBy: 'system',
        flagReason: 'Tone escalation pattern',
        status: 'resolved',
        priority: 'medium',
        actionTaken: 'warned',
        resolutionNotes: 'User was warned. First offence, no prior history.',
        createdAt: daysAgo(20),
        resolvedAt: daysAgo(18),
      },
    ],
  });
  console.log('  ✓ Created 8 moderation queue items (4 pending, 2 reviewing, 2 resolved)');

  // ─────────────────────────────────────────
  // Parent alerts
  // ─────────────────────────────────────────
  console.log('Creating parent alerts...');
  await prisma.parentAlert.createMany({
    data: [
      {
        parentAccountId: parentAccount.id,
        memberUserId: minor.id,
        alertType: 'prolonged_calm_mode',
        severity: 'info',
        messageFr: 'Léo est en mode calme depuis 45 minutes.',
        messageEn: 'Léo has been in calm mode for 45 minutes.',
        acknowledged: false,
        createdAt: minsAgo(45),
      },
      {
        parentAccountId: parentAccount.id,
        memberUserId: minor.id,
        alertType: 'stress_indicator',
        severity: 'warning',
        messageFr: "Léo a activé le mode calme 4 fois aujourd'hui.",
        messageEn: 'Léo activated calm mode 4 times today.',
        acknowledged: false,
        createdAt: hoursAgo(3),
      },
      {
        parentAccountId: parentAccount.id,
        memberUserId: minor.id,
        alertType: 'inactivity',
        severity: 'info',
        messageFr: "Léo n'a pas envoyé de messages depuis 3 jours.",
        messageEn: 'Léo has not sent any messages in 3 days.',
        acknowledged: true,
        acknowledgedAt: daysAgo(1),
        createdAt: daysAgo(2),
      },
      {
        parentAccountId: parentAccount.id,
        memberUserId: minor.id,
        alertType: 'flagged_message',
        severity: 'urgent',
        messageFr: 'Un message envoyé à Léo a été signalé par le système de modération.',
        messageEn: 'A message sent to Léo was flagged by the moderation system.',
        acknowledged: false,
        createdAt: daysAgo(1),
      },
    ],
  });
  console.log('  ✓ Created 4 parent alerts (3 unacknowledged, 1 acknowledged)');

  // ─────────────────────────────────────────
  // Member indicators (Léo — last 7 days)
  // ─────────────────────────────────────────
  console.log('Creating member indicators...');
  const indicatorData = [
    { daysBack: 6, energy: 'high', calmMins: 0, sent: 12, received: 15 },
    { daysBack: 5, energy: 'medium', calmMins: 20, sent: 8, received: 9 },
    { daysBack: 4, energy: 'medium', calmMins: 35, sent: 6, received: 10 },
    { daysBack: 3, energy: 'low', calmMins: 60, sent: 2, received: 5 },
    { daysBack: 2, energy: 'low', calmMins: 90, sent: 1, received: 3 },
    { daysBack: 1, energy: 'low', calmMins: 45, sent: 5, received: 8 },
    { daysBack: 0, energy: 'low', calmMins: 45, sent: 3, received: 4 },
  ] as const;

  for (const row of indicatorData) {
    const d = daysAgo(row.daysBack);
    d.setHours(0, 0, 0, 0);
    await prisma.memberIndicator.create({
      data: {
        userId: minor.id,
        recordedAt: d,
        socialEnergyAvg: row.energy,
        calmModeMinutes: row.calmMins,
        messagesSent: row.sent,
        messagesReceived: row.received,
      },
    });
  }
  console.log('  ✓ Created 7 days of member indicators for Léo');

  // ─────────────────────────────────────────
  // Done
  // ─────────────────────────────────────────
  console.log('\n✅ Seeding complete!\n');
  console.log('Test accounts (password for all: Password123!):');
  console.log('  marie@test.com   — adult, French, fully onboarded');
  console.log('  alex@test.com    — adult, English, fully onboarded (has blocked Sam)');
  console.log('  sam@test.com     — adult, English, partial onboarding (blocked by Alex)');
  console.log('  jordan@test.com  — adult, English, fully onboarded');
  console.log('  mod@test.com     — moderator account (redirects to /moderation)');
  console.log('  parent@test.com  — parent account (manages Léo)');
  console.log('  minor@test.com   — parent-managed minor (Léo)');
  console.log('\nConversations:');
  console.log('  Marie ↔ Alex   — 7 messages over 3 days');
  console.log('  Alex  ↔ Sam    — 6 messages, Alex blocked Sam after');
  console.log('  Marie ↔ Jordan — 5 warm messages');
  console.log('  Alex  ↔ Jordan — flagged message, reported by Jordan');
  console.log('\nModeration: 4 pending, 2 reviewing, 2 resolved');
  console.log('Parent alerts: 3 unacknowledged (1 urgent), 1 acknowledged');
  console.log('\nInvite codes: BETA2024, TESTCODE\n');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
