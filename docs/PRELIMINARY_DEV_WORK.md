# Otantist — Preliminary Development Work

**What You Can Start Right Now**

Your dev environment is running. Here's what you can work on immediately, organized by complexity and dependency.

---

## 🟢 Start Today (No Dependencies)

### 1. Update Prisma Schema

The current seed data suggests a basic schema exists, but you need the full MVP schema.

**Location:** `apps/api/prisma/schema.prisma`

**Action:** Replace with the complete schema from MVP_SPECIFICATION_v2.md (Section 3)

```bash
cd apps/api

# After updating schema.prisma:
npx prisma migrate dev --name mvp_schema_update

# Regenerate client
npx prisma generate

# Verify in Prisma Studio
npx prisma studio
```

**Time estimate:** 1-2 hours

---

### 2. Set Up i18n Infrastructure

Bilingual support is required from day one. Set this up now so all future work includes translations.

**For Next.js (apps/web):**

```bash
cd apps/web
npm install i18next react-i18next i18next-browser-languagedetector
```

**Create translation structure:**

```
apps/web/
├── locales/
│   ├── fr/
│   │   ├── common.json
│   │   ├── auth.json
│   │   └── onboarding.json
│   └── en/
│       ├── common.json
│       ├── auth.json
│       └── onboarding.json
├── lib/
│   └── i18n.ts
```

**Example `locales/fr/common.json`:**
```json
{
  "app_name": "Otantist",
  "loading": "Chargement...",
  "error": "Une erreur s'est produite",
  "save": "Enregistrer",
  "cancel": "Annuler",
  "continue": "Continuer",
  "back": "Retour"
}
```

**Example `locales/en/common.json`:**
```json
{
  "app_name": "Otantist",
  "loading": "Loading...",
  "error": "An error occurred",
  "save": "Save",
  "cancel": "Cancel",
  "continue": "Continue",
  "back": "Back"
}
```

**Time estimate:** 2-3 hours

---

### 3. Create DTOs and Validation

Define your Data Transfer Objects with class-validator. These are used across the API.

**Install (if not already):**
```bash
cd apps/api
npm install class-validator class-transformer
```

**Create:** `apps/api/src/common/dto/`

**Example `register.dto.ts`:**
```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecureP@ss123' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiProperty({ example: 'BETA2026' })
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  inviteCode: string;

  @ApiProperty({ example: 'fr', enum: ['fr', 'en'] })
  @IsIn(['fr', 'en'])
  language: 'fr' | 'en';
}
```

**Time estimate:** 3-4 hours for all DTOs

---

### 4. Enhance Auth Module

The scaffolding exists, but needs the full implementation.

**What to add:**
- Invite code validation service
- Email verification flow
- Password reset flow
- Bilingual error messages

**Key files to create/update:**
```
apps/api/src/auth/
├── auth.controller.ts      # Add all endpoints
├── auth.service.ts         # Add business logic
├── auth.module.ts          # Wire up dependencies
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── verify-email.dto.ts
│   └── reset-password.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── local-auth.guard.ts
└── strategies/
    ├── jwt.strategy.ts
    └── local.strategy.ts
```

**Time estimate:** 1-2 days

---

## 🟡 Start This Week (Light Dependencies)

### 5. Build Users Module

Depends on: Auth module (for guards), Prisma schema

**Endpoints to implement:**
- `GET /users/me` — Get current user
- `PATCH /users/me` — Update profile
- `GET /users/me/onboarding-status` — Onboarding progress
- `PATCH /users/me/language` — Change language

**Key feature:** Onboarding status tracking with `sectionComplete` booleans

**Time estimate:** 1 day

---

### 6. Build Preferences Module

Depends on: Users module, Prisma schema

**Endpoints to implement:**
- Communication preferences CRUD
- Sensory preferences CRUD
- Time boundaries CRUD
- Conversation starters CRUD

**Key feature:** Partial save support — each PATCH should only update provided fields

**Time estimate:** 1-2 days

---

### 7. Build User State Module

Depends on: Users module

**Endpoints to implement:**
- `GET /state/current`
- `PATCH /state/social-energy`
- `POST /state/calm-mode/activate`
- `POST /state/calm-mode/deactivate`

**Key feature:** Calm mode should trigger parent alerts (for managed accounts)

**Time estimate:** 0.5-1 day

---

### 8. Create Seed Data Script

Update the seed script to create realistic test data.

**Location:** `apps/api/prisma/seed.ts`

**Include:**
- 2-3 adult accounts with full profiles
- 1 parent account with managed minor
- Test invite codes
- Sample conversations and messages
- Various preference configurations

**Time estimate:** 2-3 hours

---

## 🔴 Start Later (Heavier Dependencies)

### 9. Messaging Module + Socket.io

Depends on: Users, Preferences (for time boundaries), User State

**This is the core feature.** Take your time to get it right.

**Components:**
- Conversation CRUD
- Message CRUD with soft delete
- Time boundary enforcement (queuing)
- Socket.io gateway for real-time
- Typing indicators
- Read receipts
- Message status updates

**Time estimate:** 3-5 days

---

### 10. Safety & Moderation

Depends on: Messaging module, Users module

**Components:**
- Blocking system
- Reporting system
- Moderation queue
- AI flagging integration (Claude API)
- Admin moderation dashboard

**Time estimate:** 2-3 days

---

### 11. Parent Dashboard

Depends on: Most other modules

**Components:**
- Parent-managed account linking
- Member indicators aggregation
- Alert generation and delivery
- Dashboard API endpoints

**Time estimate:** 2-3 days

---

## Quick Wins (Anytime)

These can be done in parallel with other work:

| Task | Time | Notes |
|------|------|-------|
| Add Swagger decorators to existing endpoints | 1-2 hours | Improves API docs |
| Set up ESLint + Prettier config | 30 min | Consistency |
| Create `.env.example` with all required vars | 30 min | Onboarding |
| Write README for each app | 1-2 hours | Documentation |
| Add health check endpoint | 15 min | `/api/health` |
| Configure CORS properly | 30 min | Security |
| Add request logging middleware | 30 min | Debugging |

---

## Suggested Order of Operations

```
Week 1:
├── Day 1-2: Prisma schema + migrations
├── Day 3: i18n setup
├── Day 4-5: Auth module completion

Week 2:
├── Day 1-2: Users module
├── Day 3-4: Preferences module
├── Day 5: User State module

Week 3:
├── Day 1-3: Messaging (REST endpoints)
├── Day 4-5: Socket.io integration

Week 4:
├── Day 1-2: Time boundary enforcement
├── Day 3-4: Safety features (blocking, reporting)
├── Day 5: Testing + bug fixes
```

---

## Commands You'll Use Often

```bash
# Start everything
npm run docker:up
npm run dev:api      # Terminal 1
npm run dev:web      # Terminal 2

# Database
cd apps/api
npx prisma migrate dev --name your_migration_name
npx prisma generate
npx prisma studio
npx prisma db seed

# Generate NestJS scaffolding
npx nest generate module module-name
npx nest generate controller module-name
npx nest generate service module-name

# Testing
npm test
npm run test:watch
npm run test:cov
```

---

## Questions to Resolve Before Coding

1. **Email provider for verification?** (Mailhog for dev, but what for production?)
2. **JWT secret rotation strategy?**
3. **Rate limiting thresholds?**
4. **Max message length?**
5. **File upload limits (profile images)?**

---

*Ready to start? I'd recommend beginning with the Prisma schema update — it's foundational for everything else.*
