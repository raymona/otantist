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

  // Create invite codes
  console.log('Creating invite codes...');
  const inviteCodes = await Promise.all([
    prisma.inviteCode.create({
      data: {
        code: 'BETA2024',
        maxUses: 100,
        currentUses: 0,
      },
    }),
    prisma.inviteCode.create({
      data: {
        code: 'TESTCODE',
        maxUses: 10,
        currentUses: 0,
      },
    }),
  ]);
  console.log(`  ✓ Created ${inviteCodes.length} invite codes`);

  // Create test accounts and users
  console.log('Creating test users...');
  const passwordHash = await bcrypt.hash('Password123!', 12);

  // Adult user 1 - Marie (French)
  const marieAccount = await prisma.account.create({
    data: {
      email: 'marie@test.com',
      passwordHash,
      accountType: 'adult',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'fr',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: new Date(),
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

  // Adult user 2 - Alex (English)
  const alexAccount = await prisma.account.create({
    data: {
      email: 'alex@test.com',
      passwordHash,
      accountType: 'adult',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'en',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: new Date(),
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

  // Adult user 3 - Sam (partially onboarded)
  const samAccount = await prisma.account.create({
    data: {
      email: 'sam@test.com',
      passwordHash,
      accountType: 'adult',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'en',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      accountId: samAccount.id,
      displayName: 'Sam',
      ageGroup: 'age_18_25',
      profileVisibility: 'visible',
      onboardingComplete: false,
      onboardingStep: 'sensory_preferences',
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
      legalAcceptedAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      accountId: parentAccount.id,
      displayName: 'Parent Test',
      ageGroup: 'age_40_plus',
      profileVisibility: 'hidden',
      onboardingComplete: true,
    },
  });

  // Minor (parent-managed) account
  const minorAccount = await prisma.account.create({
    data: {
      email: 'minor@test.com',
      passwordHash,
      accountType: 'parent_managed',
      status: 'active',
      emailVerified: true,
      preferredLanguage: 'fr',
      inviteCodeUsed: 'BETA2024',
      legalAcceptedAt: new Date(),
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

  // Create parent-managed relationship
  await prisma.parentManagedAccount.create({
    data: {
      parentAccountId: parentAccount.id,
      memberAccountId: minorAccount.id,
      relationship: 'parent',
      status: 'active',
      consentGivenAt: new Date(),
    },
  });

  console.log(`  ✓ Created 5 test users`);

  // Create communication preferences
  console.log('Creating communication preferences...');
  await prisma.communicationPreference.create({
    data: {
      userId: marie.id,
      commModes: ['text', 'emoji'],
      preferredTone: 'gentle',
      slowRepliesOk: true,
      oneMessageAtTime: true,
      readWithoutReply: true,
      sectionComplete: true,
    },
  });

  await prisma.communicationPreference.create({
    data: {
      userId: alex.id,
      commModes: ['text'],
      preferredTone: 'direct',
      slowRepliesOk: true,
      oneMessageAtTime: false,
      readWithoutReply: true,
      sectionComplete: true,
    },
  });

  await prisma.communicationPreference.create({
    data: {
      userId: minor.id,
      commModes: ['text', 'emoji'],
      preferredTone: 'enthusiastic',
      slowRepliesOk: true,
      oneMessageAtTime: true,
      readWithoutReply: false,
      sectionComplete: true,
    },
  });
  console.log(`  ✓ Created communication preferences`);

  // Create conversation starters
  console.log('Creating conversation starters...');
  await prisma.conversationStarter.create({
    data: {
      userId: marie.id,
      goodTopics: ['art', 'nature', 'books', 'cooking'],
      avoidTopics: ['politics', 'loud events'],
      interactionTips: ['I need time to respond', 'Please be patient with me'],
      sectionComplete: true,
    },
  });

  await prisma.conversationStarter.create({
    data: {
      userId: alex.id,
      goodTopics: ['video games', 'programming', 'music'],
      avoidTopics: ['sports', 'small talk'],
      interactionTips: ['I prefer direct communication', 'No need for pleasantries'],
      sectionComplete: true,
    },
  });

  await prisma.conversationStarter.create({
    data: {
      userId: minor.id,
      goodTopics: ['minecraft', 'animals', 'drawing'],
      avoidTopics: ['school stress', 'loud noises'],
      interactionTips: ['I like emoji!', 'Short messages please'],
      sectionComplete: true,
    },
  });
  console.log(`  ✓ Created conversation starters`);

  // Create sensory preferences
  console.log('Creating sensory preferences...');
  await prisma.sensoryPreference.create({
    data: {
      userId: marie.id,
      enableAnimations: false,
      colorIntensity: 'reduced',
      soundEnabled: false,
      notificationLimit: 5,
      notificationGrouped: true,
      sectionComplete: true,
    },
  });

  await prisma.sensoryPreference.create({
    data: {
      userId: alex.id,
      enableAnimations: true,
      colorIntensity: 'standard',
      soundEnabled: true,
      notificationLimit: null,
      notificationGrouped: false,
      sectionComplete: true,
    },
  });
  console.log(`  ✓ Created sensory preferences`);

  // Create time boundaries
  console.log('Creating time boundaries...');
  // Marie: available 9am-9pm weekdays, 10am-6pm weekends
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
  console.log(`  ✓ Created time boundaries`);

  // Create user states
  console.log('Creating user states...');
  await prisma.userState.create({
    data: {
      userId: marie.id,
      socialEnergy: 'medium',
      energyUpdatedAt: new Date(),
      calmModeActive: false,
      isOnline: false,
    },
  });

  await prisma.userState.create({
    data: {
      userId: alex.id,
      socialEnergy: 'high',
      energyUpdatedAt: new Date(),
      calmModeActive: false,
      isOnline: true,
      lastSeen: new Date(),
    },
  });

  await prisma.userState.create({
    data: {
      userId: minor.id,
      socialEnergy: 'low',
      energyUpdatedAt: new Date(),
      calmModeActive: true,
      calmModeStarted: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      isOnline: true,
      lastSeen: new Date(),
    },
  });
  console.log(`  ✓ Created user states`);

  // Create a conversation between Marie and Alex
  console.log('Creating conversations and messages...');
  const conversation = await prisma.conversation.create({
    data: {
      userAId: marie.id,
      userBId: alex.id,
      status: 'active',
    },
  });

  // Add some messages
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: alex.id,
      messageType: 'text',
      content: 'Salut Marie! I saw you like art. What kind do you create?',
      status: 'read',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: marie.id,
      messageType: 'text',
      content: 'Bonjour Alex! I mostly do watercolors. Nature scenes. 🎨',
      status: 'read',
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: alex.id,
      messageType: 'text',
      content: "That's cool! I've always wanted to try painting but I'm better with digital art.",
      status: 'delivered',
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      deliveredAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  });
  console.log(`  ✓ Created 1 conversation with 3 messages`);

  // Create a parent alert
  console.log('Creating parent alerts...');
  await prisma.parentAlert.create({
    data: {
      parentAccountId: parentAccount.id,
      memberUserId: minor.id,
      alertType: 'prolonged_calm_mode',
      severity: 'info',
      messageFr: 'Léo est en mode calme depuis 30 minutes.',
      messageEn: 'Léo has been in calm mode for 30 minutes.',
      acknowledged: false,
    },
  });
  console.log(`  ✓ Created parent alerts`);

  // Create member indicators
  console.log('Creating member indicators...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.memberIndicator.create({
    data: {
      userId: minor.id,
      recordedAt: today,
      socialEnergyAvg: 'medium',
      calmModeMinutes: 45,
      messagesSent: 5,
      messagesReceived: 8,
    },
  });
  console.log(`  ✓ Created member indicators`);

  console.log('\n✅ Seeding complete!\n');
  console.log('Test accounts (password for all: Password123!):');
  console.log('  - marie@test.com (adult, French)');
  console.log('  - alex@test.com (adult, English)');
  console.log('  - sam@test.com (adult, partial onboarding)');
  console.log('  - parent@test.com (parent account)');
  console.log('  - minor@test.com (parent-managed minor)');
  console.log('\nInvite codes: BETA2024, TESTCODE\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });