# Otantist MVP Technical Specification

**Version 2.0 — Updated February 2026**  
**Status: Ready for Development**  
**Scope: Minimum Safe and Ethical Viable Product**

---

## 1. MVP Overview

### What We're Building

A bilingual (FR/EN) web application for 1:1 messaging between autistic individuals, with:

- Invite-only access (controlled beta)
- Parent-managed accounts for minors
- Communication preference profiles
- Time boundary enforcement
- Calm Mode for sensory breaks
- Human-moderated safety with AI-assisted flagging

### What We're NOT Building (Yet)

| Feature | Phase |
|---------|-------|
| Mobile apps (iOS/Android) | Phase 2 |
| User discovery/matching | Phase 2 |
| Group messaging | Phase 2 |
| AI message suggestions | Phase 2 |
| Voice messages | Phase 2 |
| Payment processing | Phase 2C |
| Professional integrations | Phase 2D |

---

## 2. Technology Stack (Confirmed)

### Currently Running

| Component | Technology | Port | Status |
|-----------|------------|------|--------|
| Backend | NestJS (Node.js 20) | 3001 | ✅ Running |
| Web Frontend | Next.js 14 | 3000 | ✅ Running |
| Database | PostgreSQL 15 | 5432 | ✅ Running |
| ORM | Prisma | - | ✅ Configured |
| Cache | Redis 7 | 6379 | ✅ Running |
| Email Testing | Mailhog | 8025 | ✅ Running |
| DB Admin | Prisma Studio | 5555 | ✅ Available |

### To Implement

| Component | Technology | Priority |
|-----------|------------|----------|
| Real-time | Socket.io | High (messaging) |
| AI Flagging | Claude API | Medium |
| File Storage | Cloudflare R2 | Low (profile images) |
| i18n | i18next | High |

---

## 3. Database Schema (Prisma)

### 3.1 Core Models

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTICATION & ACCOUNTS
// ============================================

model Account {
  id                String    @id @default(uuid())
  email             String    @unique
  passwordHash      String    @map("password_hash")
  accountType       AccountType @default(adult) @map("account_type")
  status            AccountStatus @default(pending)
  emailVerified     Boolean   @default(false) @map("email_verified")
  inviteCodeUsed    String?   @map("invite_code_used")
  legalAcceptedAt   DateTime? @map("legal_accepted_at")
  preferredLanguage Language  @default(fr) @map("preferred_language")
  createdAt         DateTime  @default(now()) @map("created_at")
  lastLogin         DateTime? @map("last_login")

  user              User?
  parentOf          ParentManagedAccount[] @relation("ParentAccount")
  managedBy         ParentManagedAccount[] @relation("MemberAccount")
  inviteCodesCreated InviteCode[]
  parentAlerts      ParentAlert[]

  @@map("accounts")
}

enum AccountType {
  adult
  parent_managed
}

enum AccountStatus {
  pending
  active
  suspended
}

enum Language {
  fr
  en
}

model User {
  id                  String    @id @default(uuid())
  accountId           String    @unique @map("account_id")
  displayName         String?   @map("display_name") @db.VarChar(50)
  ageGroup            AgeGroup? @map("age_group")
  profileVisibility   ProfileVisibility @default(visible) @map("profile_visibility")
  onboardingComplete  Boolean   @default(false) @map("onboarding_complete")
  onboardingStep      String?   @map("onboarding_step")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  account             Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  communicationPrefs  CommunicationPreferences?
  sensoryPrefs        SensoryPreferences?
  conversationStarters ConversationStarters?
  timeBoundaries      TimeBoundary[]
  userState           UserState?
  interests           Interest[]
  
  conversationsAsA    Conversation[] @relation("UserA")
  conversationsAsB    Conversation[] @relation("UserB")
  messagesSent        Message[]
  blockedUsers        BlockedUser[] @relation("Blocker")
  blockedBy           BlockedUser[] @relation("Blocked")
  reportsSubmitted    UserReport[] @relation("Reporter")
  reportsReceived     UserReport[] @relation("Reported")
  memberIndicators    MemberIndicator[]
  parentAlerts        ParentAlert[]

  @@map("users")
}

enum AgeGroup {
  age_14_17 @map("14-17")
  age_18_25 @map("18-25")
  age_26_40 @map("26-40")
  age_40_plus @map("40+")
}

enum ProfileVisibility {
  visible
  limited
  hidden
}

model ParentManagedAccount {
  id              String    @id @default(uuid())
  parentAccountId String    @map("parent_account_id")
  memberAccountId String    @map("member_account_id")
  relationship    ParentRelationship
  consentGivenAt  DateTime? @map("consent_given_at")
  status          ParentStatus @default(pending)
  createdAt       DateTime  @default(now()) @map("created_at")

  parentAccount   Account   @relation("ParentAccount", fields: [parentAccountId], references: [id])
  memberAccount   Account   @relation("MemberAccount", fields: [memberAccountId], references: [id])

  @@unique([parentAccountId, memberAccountId])
  @@map("parent_managed_accounts")
}

enum ParentRelationship {
  parent
  legal_guardian
  other
}

enum ParentStatus {
  pending
  active
  ended
}

model InviteCode {
  id          String    @id @default(uuid())
  code        String    @unique @db.VarChar(50)
  createdById String?   @map("created_by")
  maxUses     Int       @default(1) @map("max_uses")
  currentUses Int       @default(0) @map("current_uses")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  createdBy   Account?  @relation(fields: [createdById], references: [id])

  @@map("invite_codes")
}

// ============================================
// PREFERENCES
// ============================================

model CommunicationPreferences {
  id                String    @id @default(uuid())
  userId            String    @unique @map("user_id")
  commModes         String[]  @map("comm_modes")
  preferredTone     Tone?     @map("preferred_tone")
  slowRepliesOk     Boolean?  @map("slow_replies_ok")
  oneMessageAtTime  Boolean?  @map("one_message_at_time")
  readWithoutReply  Boolean?  @map("read_without_reply")
  sectionComplete   Boolean   @default(false) @map("section_complete")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("communication_preferences")
}

enum Tone {
  gentle
  direct
  enthusiastic
  formal
}

model SensoryPreferences {
  id                  String    @id @default(uuid())
  userId              String    @unique @map("user_id")
  enableAnimations    Boolean   @default(false) @map("enable_animations")
  colorIntensity      ColorIntensity? @map("color_intensity")
  soundEnabled        Boolean   @default(false) @map("sound_enabled")
  notificationLimit   Int?      @map("notification_limit")
  notificationGrouped Boolean   @default(true) @map("notification_grouped")
  sectionComplete     Boolean   @default(false) @map("section_complete")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sensory_preferences")
}

enum ColorIntensity {
  standard
  reduced
  minimal
}

model ConversationStarters {
  id              String    @id @default(uuid())
  userId          String    @unique @map("user_id")
  goodTopics      String[]  @map("good_topics")
  avoidTopics     String[]  @map("avoid_topics")
  interactionTips String[]  @map("interaction_tips")
  sectionComplete Boolean   @default(false) @map("section_complete")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("conversation_starters")
}

model TimeBoundary {
  id             String   @id @default(uuid())
  userId         String   @map("user_id")
  dayOfWeek      Int      @map("day_of_week") // 0-6 (Sunday-Saturday)
  availableStart DateTime @map("available_start") @db.Time
  availableEnd   DateTime @map("available_end") @db.Time
  timezone       String   @default("America/Montreal")

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("time_boundaries")
}

model Interest {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  interest  String   @db.VarChar(100)
  isPrimary Boolean  @default(false) @map("is_primary")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, interest])
  @@map("interests")
}

// ============================================
// USER STATE
// ============================================

model UserState {
  id               String       @id @default(uuid())
  userId           String       @unique @map("user_id")
  socialEnergy     SocialEnergy? @map("social_energy")
  energyUpdatedAt  DateTime?    @map("energy_updated_at")
  calmModeActive   Boolean      @default(false) @map("calm_mode_active")
  calmModeStarted  DateTime?    @map("calm_mode_started")
  isOnline         Boolean      @default(false) @map("is_online")
  lastSeen         DateTime?    @map("last_seen")

  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_state")
}

enum SocialEnergy {
  high
  medium
  low
}

// ============================================
// MESSAGING
// ============================================

model Conversation {
  id        String             @id @default(uuid())
  userAId   String             @map("user_a_id")
  userBId   String             @map("user_b_id")
  status    ConversationStatus @default(active)
  createdAt DateTime           @default(now()) @map("created_at")
  updatedAt DateTime           @updatedAt @map("updated_at")

  userA     User               @relation("UserA", fields: [userAId], references: [id])
  userB     User               @relation("UserB", fields: [userBId], references: [id])
  messages  Message[]

  @@unique([userAId, userBId])
  @@map("conversations")
}

enum ConversationStatus {
  active
  blocked
  archived
}

model Message {
  id             String        @id @default(uuid())
  conversationId String        @map("conversation_id")
  senderId       String        @map("sender_id")
  messageType    MessageType   @default(text) @map("message_type")
  content        String
  status         MessageStatus @default(sent)
  queuedReason   String?       @map("queued_reason")
  deliverAt      DateTime?     @map("deliver_at")
  flagged        Boolean       @default(false)
  flaggedBy      FlaggedBy?    @map("flagged_by")
  flaggedReason  String?       @map("flagged_reason")
  createdAt      DateTime      @default(now()) @map("created_at")
  deliveredAt    DateTime?     @map("delivered_at")
  readAt         DateTime?     @map("read_at")
  deletedAt      DateTime?     @map("deleted_at")

  conversation   Conversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User          @relation(fields: [senderId], references: [id])
  reports        UserReport[]

  @@map("messages")
}

enum MessageType {
  text
  emoji
  system
}

enum MessageStatus {
  queued
  sent
  delivered
  read
}

enum FlaggedBy {
  user
  ai
  moderator
}

model BlockedUser {
  id        String   @id @default(uuid())
  blockerId String   @map("blocker_id")
  blockedId String   @map("blocked_id")
  createdAt DateTime @default(now()) @map("created_at")

  blocker   User     @relation("Blocker", fields: [blockerId], references: [id])
  blocked   User     @relation("Blocked", fields: [blockedId], references: [id])

  @@unique([blockerId, blockedId])
  @@map("blocked_users")
}

// ============================================
// MODERATION
// ============================================

model ModerationQueue {
  id              String           @id @default(uuid())
  itemType        ModerationItemType @map("item_type")
  itemId          String           @map("item_id")
  flaggedBy       FlagSource       @map("flagged_by")
  flagReason      String?          @map("flag_reason")
  aiConfidence    Decimal?         @map("ai_confidence") @db.Decimal(3, 2)
  status          ModerationStatus @default(pending)
  priority        ModerationPriority @default(medium)
  reviewedById    String?          @map("reviewed_by")
  actionTaken     ModerationAction? @map("action_taken")
  resolutionNotes String?          @map("resolution_notes")
  createdAt       DateTime         @default(now()) @map("created_at")
  resolvedAt      DateTime?        @map("resolved_at")

  @@map("moderation_queue")
}

enum ModerationItemType {
  message
  user
  report
}

enum FlagSource {
  user
  ai
  system
}

enum ModerationStatus {
  pending
  reviewing
  resolved
}

enum ModerationPriority {
  low
  medium
  high
  urgent
}

enum ModerationAction {
  dismissed
  warned
  removed
  suspended
}

model UserReport {
  id                String       @id @default(uuid())
  reporterId        String       @map("reporter_id")
  reportedUserId    String?      @map("reported_user_id")
  reportedMessageId String?      @map("reported_message_id")
  reason            ReportReason
  description       String?
  createdAt         DateTime     @default(now()) @map("created_at")

  reporter          User         @relation("Reporter", fields: [reporterId], references: [id])
  reportedUser      User?        @relation("Reported", fields: [reportedUserId], references: [id])
  reportedMessage   Message?     @relation(fields: [reportedMessageId], references: [id])

  @@map("user_reports")
}

enum ReportReason {
  harassment
  inappropriate
  spam
  safety_concern
  other
}

// ============================================
// PARENT DASHBOARD
// ============================================

model ParentAlert {
  id              String        @id @default(uuid())
  parentAccountId String        @map("parent_account_id")
  memberUserId    String        @map("member_user_id")
  alertType       AlertType     @map("alert_type")
  severity        AlertSeverity
  messageFr       String        @map("message_fr")
  messageEn       String        @map("message_en")
  acknowledged    Boolean       @default(false)
  acknowledgedAt  DateTime?     @map("acknowledged_at")
  createdAt       DateTime      @default(now()) @map("created_at")

  parentAccount   Account       @relation(fields: [parentAccountId], references: [id])
  memberUser      User          @relation(fields: [memberUserId], references: [id])

  @@map("parent_alerts")
}

enum AlertType {
  flagged_message
  stress_indicator
  prolonged_calm_mode
  inactivity
}

enum AlertSeverity {
  info
  warning
  urgent
}

model MemberIndicator {
  id               String       @id @default(uuid())
  userId           String       @map("user_id")
  recordedAt       DateTime     @map("recorded_at") @db.Date
  socialEnergyAvg  SocialEnergy? @map("social_energy_avg")
  calmModeMinutes  Int          @default(0) @map("calm_mode_minutes")
  messagesSent     Int          @default(0) @map("messages_sent")
  messagesReceived Int          @default(0) @map("messages_received")

  user             User         @relation(fields: [userId], references: [id])

  @@unique([userId, recordedAt])
  @@map("member_indicators")
}
```

---

## 4. API Endpoints

### 4.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with invite code |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Invalidate refresh token |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/verify-email` | Verify email with token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/accept-terms` | Accept ToS/legal declarations |

### 4.2 Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update profile |
| GET | `/api/users/me/onboarding-status` | Get onboarding progress |
| PATCH | `/api/users/me/language` | Change language (FR/EN) |
| GET | `/api/users/:id/how-to-talk-to-me` | Get user's communication guide |

### 4.3 Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/preferences/communication` | Get communication prefs |
| PATCH | `/api/preferences/communication` | Update (partial save OK) |
| GET | `/api/preferences/sensory` | Get sensory prefs |
| PATCH | `/api/preferences/sensory` | Update |
| GET | `/api/preferences/time-boundaries` | Get time boundaries |
| PATCH | `/api/preferences/time-boundaries` | Update |
| GET | `/api/preferences/conversation-starters` | Get "How to Talk to Me" |
| PATCH | `/api/preferences/conversation-starters` | Update |

### 4.4 State

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/state/current` | Get current user state |
| PATCH | `/api/state/social-energy` | Update social energy level |
| POST | `/api/state/calm-mode/activate` | Activate calm mode |
| POST | `/api/state/calm-mode/deactivate` | Deactivate calm mode |

### 4.5 Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List conversations |
| POST | `/api/conversations` | Start new conversation |
| GET | `/api/conversations/:id` | Get conversation details |
| GET | `/api/conversations/:id/messages` | Get messages (paginated) |
| POST | `/api/conversations/:id/messages` | Send message |
| DELETE | `/api/messages/:id` | Soft delete message |
| POST | `/api/messages/:id/report` | Report message |

### 4.6 Safety

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blocked-users` | List blocked users |
| POST | `/api/blocked-users/:userId` | Block user |
| DELETE | `/api/blocked-users/:userId` | Unblock user |
| POST | `/api/reports` | Submit report |

### 4.7 Parent Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parent/members` | List managed members |
| GET | `/api/parent/members/:id/indicators` | Get member indicators |
| GET | `/api/parent/members/:id/alerts` | Get alerts |
| PATCH | `/api/parent/members/:id/alerts/:alertId/acknowledge` | Acknowledge alert |

### 4.8 Moderation (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/moderation/queue` | Get moderation queue |
| GET | `/api/moderation/queue/:id` | Get queue item details |
| PATCH | `/api/moderation/queue/:id/resolve` | Resolve item |
| GET | `/api/moderation/stats` | Get moderation stats |

---

## 5. Real-Time Events (Socket.io)

### Client → Server

```typescript
// Join personal room
socket.emit('join', { userId: string });

// Typing indicator
socket.emit('typing', { conversationId: string });

// Mark messages as read
socket.emit('markRead', { conversationId: string, messageId: string });

// Presence update
socket.emit('presence', { status: 'online' | 'away' });
```

### Server → Client

```typescript
// New message received
socket.on('newMessage', { message: Message, conversation: Conversation });

// Message status update
socket.on('messageStatus', { messageId: string, status: MessageStatus });

// Typing indicator
socket.on('userTyping', { conversationId: string, userId: string });

// Presence change
socket.on('presenceChange', { userId: string, status: string, lastSeen: Date });

// Calm mode alert (for parent dashboard)
socket.on('calmModeAlert', { userId: string, activated: boolean });
```

---

## 6. Core Feature Specifications

### 6.1 Invite Code System

**Registration requires a valid invite code:**
- Codes are generated by admins or existing users (if permitted)
- Each code has `maxUses` (default: 1) and optional `expiresAt`
- Code is validated before registration proceeds
- Used codes are tracked via `currentUses` counter

### 6.2 Modular Onboarding

**Users can complete onboarding in sections:**

| Step | Required? | Fields |
|------|-----------|--------|
| 1. Account | Yes | email, password, inviteCode |
| 2. Email Verify | Yes | verification token |
| 3. Legal Accept | Yes | ToS agreement |
| 4. Basic Profile | Yes | displayName, ageGroup |
| 5. Communication | No | tone, modes, rhythm |
| 6. Sensory | No | animations, colors, sounds |
| 7. "How to Talk to Me" | No | topics, tips |

Each section has `sectionComplete` boolean. Users can access basic features before completing all sections.

### 6.3 Time Boundary Enforcement

**Messages respect recipient's availability:**

```
1. User A sends message to User B
2. System checks B's time_boundaries for current day/time
3. IF outside available hours:
   - Message status = 'queued'
   - deliverAt = next available time
   - Return: "Message will be delivered at [time]"
4. ELSE:
   - Deliver immediately
   - Send notification (if enabled)
```

### 6.4 Calm Mode

**Activation triggers:**
- Manual toggle in UI
- "I need a break" button

**Effects:**
- UI: Reduced colors, no animations, simplified interface
- Server: Queue incoming messages, suppress notifications
- Parent: Alert generated (for managed accounts)

**Deactivation:**
- Manual toggle only (no auto-timeout by default)

### 6.5 AI Content Flagging

**Background analysis only — never blocks messages:**

```typescript
async function analyzeMessage(message: Message) {
  const response = await claude.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Analyze for safety concerns. Context: autism social platform.
                Message: "${message.content}"
                Flag ONLY for: harassment, explicit content, safety threats, manipulation.
                Account for autistic communication patterns.
                Respond JSON: { shouldFlag, confidence, reason, priority }`
    }]
  });

  const result = JSON.parse(response.content[0].text);
  
  if (result.shouldFlag && result.confidence > 0.7) {
    await createModerationQueueItem({
      itemType: 'message',
      itemId: message.id,
      flaggedBy: 'ai',
      flagReason: result.reason,
      aiConfidence: result.confidence,
      priority: result.priority
    });
  }
}
```

**Important:** AI flags but NEVER blocks. Human moderators review all flagged content.

---

## 7. Bilingual Implementation

### Translation Files Structure

```
/locales
  /fr
    common.json
    auth.json
    onboarding.json
    messaging.json
    settings.json
    errors.json
  /en
    common.json
    auth.json
    onboarding.json
    messaging.json
    settings.json
    errors.json
```

### Usage (Next.js with i18next)

```typescript
import { useTranslation } from 'react-i18next';

function WelcomeScreen() {
  const { t, i18n } = useTranslation('onboarding');
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('fr')}>FR</button>
      <button onClick={() => i18n.changeLanguage('en')}>EN</button>
    </div>
  );
}
```

### Database Content

- System messages: Use translation keys
- User content: Store as-is in original language
- Parent alerts: Store both `message_fr` and `message_en`

---

## 8. Security Checklist

### Authentication
- [x] Password hashing (bcrypt, cost 12)
- [x] JWT with short expiry (15min access, 7d refresh)
- [ ] Rate limiting on auth endpoints
- [ ] Email verification required

### Data Protection
- [ ] All API endpoints require authentication
- [ ] Users can only access their own data
- [ ] Parent access limited to managed accounts
- [ ] Soft delete for messages
- [ ] No sensitive data in logs

### Privacy
- [ ] Minimal data collection
- [ ] No document/ID uploads
- [ ] Clear consent flows
- [ ] Data export capability
- [ ] Account deletion with data removal

### Minor Protection
- [ ] Parent-managed accounts
- [ ] Human moderation
- [ ] No direct adult-minor contact (unrelated)
- [ ] Parent alerts for concerning patterns

---

## 9. MVP Feature Checklist

### Must Have

- [ ] Invite code validation
- [ ] Account creation (adult + parent-managed)
- [ ] Email verification flow
- [ ] Legal acceptance (ToS)
- [ ] Bilingual UI (FR/EN)
- [ ] Modular onboarding with save-and-return
- [ ] Basic profile (displayName, ageGroup)
- [ ] Communication preferences
- [ ] "How to Talk to Me" panel
- [ ] Time boundary configuration
- [ ] Time boundary enforcement
- [ ] 1:1 messaging (text, emoji)
- [ ] Message queuing for boundaries
- [ ] Calm Mode activation/deactivation
- [ ] Social energy selector
- [ ] User blocking
- [ ] User reporting
- [ ] AI-assisted content flagging
- [ ] Human moderation dashboard
- [ ] Parent dashboard (indicators)
- [ ] Parent alerts

### Explicitly NOT in MVP

- ❌ User discovery/matching
- ❌ Group messaging
- ❌ AI message suggestions
- ❌ Voice messages
- ❌ Pictograms
- ❌ Payment processing
- ❌ Mobile apps
- ❌ Professional integrations
- ❌ Continuity Protocol

---

## 10. Development Priorities

### Sprint 1-2: Foundation (Weeks 1-3)
1. Prisma schema setup
2. Auth module (register, login, JWT)
3. Invite code validation
4. Email verification
5. i18n setup

### Sprint 3-4: User System (Weeks 4-6)
1. User profile CRUD
2. Communication preferences
3. Sensory preferences
4. Conversation starters
5. Time boundaries
6. Onboarding flow

### Sprint 5-6: Messaging (Weeks 7-9)
1. Conversation model
2. Message CRUD
3. Time boundary enforcement
4. Socket.io integration
5. Typing indicators
6. Read receipts

### Sprint 7-8: Safety (Weeks 10-12)
1. User state (energy, calm mode)
2. Calm Mode implementation
3. Blocking system
4. Reporting system
5. AI flagging integration
6. Moderation queue

### Sprint 9-10: Parent Features (Weeks 13-14)
1. Parent-managed accounts
2. Member indicators
3. Parent alerts
4. Parent dashboard UI

### Sprint 11-12: Polish (Weeks 15-16)
1. Testing
2. Bug fixes
3. Performance optimization
4. Beta preparation

---

*Document Version: 2.0*  
*Updated: February 2026*  
*Status: Ready for Development*
