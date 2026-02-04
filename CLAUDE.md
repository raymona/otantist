# CLAUDE.md - Otantist Project Context

## Project Overview

**Otantist** is an emotionally safe, sensory-adapted social platform designed specifically for autistic individuals. This is an invite-only MVP focused on 1:1 messaging with communication adaptation, sensory controls, and emotional safety systems.

**Platform Type:** Native Mobile App (iOS + Android) + Web Application  
**Primary Users:** Autistic individuals (14+), Parents/Guardians  
**Languages:** Fully bilingual (French & English) from MVP  
**Launch Strategy:** Invite-only beta

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile** | React Native + Expo |
| **Web** | Next.js 14 (App Router) |
| **Backend** | Node.js 20 + NestJS |
| **Database** | PostgreSQL 15 + Prisma ORM |
| **Cache** | Redis |
| **Real-time** | Socket.io |
| **Email** | Nodemailer (Mailhog for dev) |
| **AI Moderation** | Claude API (background flagging only) |
| **File Storage** | Cloudflare R2 (planned) |

---

## Project Structure

```
otantist/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── auth/        # ✅ COMPLETE - Registration, login, JWT, email verify, invite codes
│   │       ├── users/       # 🔨 IN PROGRESS - Profile, onboarding status
│   │       ├── preferences/ # 📋 SCAFFOLDED - Communication, sensory, time boundaries
│   │       ├── messaging/   # 📋 SCAFFOLDED - 1:1 messaging
│   │       ├── moderation/  # 📋 SCAFFOLDED - AI flagging, human review
│   │       ├── parent-dashboard/ # 📋 SCAFFOLDED - Indicators, alerts
│   │       ├── email/       # ✅ COMPLETE - Email service
│   │       └── prisma/      # ✅ COMPLETE - Prisma service
│   ├── web/                 # Next.js web app (not started)
│   └── mobile/              # React Native + Expo (not started)
├── packages/
│   ├── shared/              # Shared types & constants
│   └── ui/                  # Shared UI components
├── scripts/
│   └── init-db.sql
└── docker-compose.yml
```

---

## Development Environment

### Running Services

```bash
# Start Docker containers (PostgreSQL, Redis, Mailhog)
npm run docker:up

# Start API server (from root)
npm run dev:api

# Start web app (from root)  
npm run dev:web
```

### URLs

| Service | URL |
|---------|-----|
| API | http://localhost:3001 |
| Swagger Docs | http://localhost:3001/api/docs |
| Web App | http://localhost:3000 |
| Mailhog UI | http://localhost:8025 |
| Prisma Studio | `cd apps/api && npx prisma studio` |

### Database Commands

```bash
cd apps/api

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name descriptive_name

# Reset database (deletes all data)
npx prisma migrate reset

# Seed test data
npm run db:seed
```

---

## Module Development Status

### ✅ COMPLETE

#### Auth Module (`apps/api/src/auth/`)
- `POST /api/auth/register` - Register a new account (with invite code)
- `POST /api/auth/login` - Login to account (returns JWT)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- JWT strategy with guards
- Bilingual error messages

#### Email Module (`apps/api/src/email/`)
- Email service with Nodemailer
- Verification email templates (FR/EN)

#### Prisma Module (`apps/api/src/prisma/`)
- PrismaService with connection handling

---

### 🔨 IN PROGRESS

#### Users Module (`apps/api/src/users/`)
**Next to build:**
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile (displayName, ageGroup, etc.)
- `GET /api/users/me/onboarding-status` - Get onboarding progress
- `PATCH /api/users/me/language` - Change language preference
- `GET /api/users/:id/how-to-talk-to-me` - Get another user's communication guide

**Key features:**
- All endpoints protected with JWT authentication
- Onboarding tracking (which sections are complete)
- Profile visibility controls

---

### 📋 SCAFFOLDED (Not Yet Implemented)

#### Preferences Module
- `GET/PATCH /api/preferences/communication`
- `GET/PATCH /api/preferences/sensory`
- `GET/PATCH /api/preferences/time-boundaries`
- `GET/PATCH /api/preferences/conversation-starters`
- Modular save-and-return (partial completion supported)

#### Messaging Module
- 1:1 messaging only (no groups in MVP)
- Time boundary enforcement
- Message queuing for blocked hours
- Real-time with Socket.io

#### Moderation Module
- AI-assisted content flagging (background only)
- Human moderation queue
- User reporting

#### Parent Dashboard Module
- Member indicators (aggregated, no specific content)
- Parent alerts
- Supervised account management

---

## Key MVP Decisions

1. **1:1 messaging only** - No groups/communities in MVP
2. **AI is background only** - No user-facing AI suggestions
3. **Human + AI moderation** - AI flags, humans decide
4. **Invite-only** - Controlled beta rollout
5. **No payment processing** - MVP is non-monetized
6. **Modular onboarding** - Users can save partial progress
7. **Age verification** - Email + legal declarations (no document uploads)

---

## Database Schema Notes

### Account Types
- `adult` - Self-managed adult account
- `parent_managed` - Minor account supervised by parent

### Key Tables
- `accounts` - Authentication credentials, invite code used
- `users` - Profile info, onboarding progress
- `parent_managed_accounts` - Parent-child relationships
- `invite_codes` - Beta access control
- `communication_preferences` - Tone, modes, rhythm
- `sensory_preferences` - Animations, colors, notifications
- `time_boundaries` - Available hours per day
- `conversation_starters` - Good/avoid topics, tips
- `user_state` - Social energy, calm mode, online status
- `conversations` - 1:1 chats
- `messages` - Message content with moderation flags
- `moderation_queue` - Items for human review
- `parent_alerts` - Notifications to parents

---

## Coding Standards

### Bilingual Content
All user-facing strings must support FR/EN:

```typescript
// ✅ Good
throw new BadRequestException({
  code: 'INVALID_EMAIL',
  message_en: 'Invalid email address',
  message_fr: 'Adresse courriel invalide',
});

// ❌ Bad
throw new BadRequestException('Invalid email');
```

### Naming Conventions
- Files: `kebab-case` (e.g., `auth.service.ts`)
- Classes: `PascalCase` (e.g., `AuthService`)
- Functions/Variables: `camelCase`
- Database columns: `snake_case`

### Module Structure
```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── dto/
│   └── index.ts
└── guards/ (if needed)
```

---

## Testing

```bash
# All tests
npm test

# API tests only
npm test -w @otantist/api

# Watch mode
npm test -- --watch
```

---

## Quick Reference Commands

```bash
# Start everything
npm run docker:up && npm run dev:api

# Database reset
cd apps/api && npx prisma migrate reset

# Generate Prisma client
cd apps/api && npx prisma generate

# Create migration
cd apps/api && npx prisma migrate dev --name <name>

# View database
cd apps/api && npx prisma studio
```

---

## Reference Documents

Located in project knowledge:
- `otantistmvpspecification.pdf` - Detailed MVP spec
- `otantisttechnicalarchitecturev2.pdf` - Architecture decisions
- `DEVELOPER_GUIDE.pdf` - Setup and workflow guide
- `Otantist___User_Registration_Flow_Solo__Dyade.png` - Registration flow diagram

---

*Last updated: February 2025*
