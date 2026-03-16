# CLAUDE.md - Otantist Project Context

## Project Overview

**Otantist** is an emotionally safe, sensory-adapted social platform designed specifically for neurodivergent individuals. This is an invite-only MVP focused on 1:1 messaging with communication adaptation, sensory controls, and emotional safety systems.

**Platform Type:** Native Mobile App (iOS + Android) + Web Application
**Primary Users:** Neurodivergent individuals (14+), Parents/Guardians
**Languages:** Fully bilingual (French & English) from MVP
**Launch Strategy:** Invite-only beta

---

## Tech Stack

| Layer             | Technology                            |
| ----------------- | ------------------------------------- |
| **Mobile**        | React Native + Expo                   |
| **Web**           | Next.js 16 (App Router) + React 19    |
| **Backend**       | Node.js 20 + NestJS                   |
| **Database**      | PostgreSQL 15 + Prisma ORM            |
| **Cache**         | Redis                                 |
| **Real-time**     | Socket.io                             |
| **Email**         | Nodemailer (Mailhog for dev)          |
| **AI Moderation** | Claude API (background flagging only) |
| **File Storage**  | Cloudflare R2 (planned)               |

---

## Project Structure

Top-level layout. For detailed file trees, run `ls` or use glob patterns.

```
otantist/
├── apps/
│   ├── api/                 # NestJS backend ✅ COMPLETE
│   │   ├── prisma/          # schema.prisma + migrations
│   │   └── src/             # auth, users, preferences, state, messaging, safety,
│   │                        # moderation, admin, parent-dashboard, gateway, redis, throttler, email, prisma
│   ├── web/                 # Next.js 16 web app ✅ DEMO-READY
│   └── mobile/              # React Native + Expo (planned)
├── packages/
│   ├── shared/              # Shared types & constants
│   └── ui/                  # Shared UI components
├── scripts/                 # verify.js, init-db.sql
├── docs/                    # PROJECT_OWNER_QUESTIONS.md
└── docker-compose.yml
```

---

## Development Environment

```bash
npm run docker:up    # Start Docker (PostgreSQL, Redis, Mailhog)
npm run dev:api      # API server → http://localhost:3001
npm run dev:web      # Web app → http://localhost:3000
```

| Service       | URL                                |
| ------------- | ---------------------------------- |
| API           | http://localhost:3001              |
| Swagger Docs  | http://localhost:3001/api/docs     |
| Web App       | http://localhost:3000              |
| Mailhog UI    | http://localhost:8025              |
| Prisma Studio | `cd apps/api && npx prisma studio` |

```bash
cd apps/api
npx prisma generate                          # After schema changes
npx prisma migrate dev --name descriptive_name  # New migration
npx prisma migrate reset                     # Reset DB (deletes all data)
npm run db:seed                              # Seed test data
```

---

## Current Status

**Phase 1 (Backend) and Phase 2 (Frontend) are complete.** All features are implemented and demo-ready. The app is deployed to Railway (API) + Vercel (web).

### Feature Summary

All 48 features are implemented. Key ones to know about:

- **Auth:** Registration (invite code), login, JWT, password reset, accept-terms gate
- **Onboarding:** 5-step flow (profile → communication → sensory → conversation starters → complete)
- **Messaging:** 1:1 conversations, real-time via Socket.io, delete-for-me, hide/unhide conversation, time boundary queuing, calm mode message queuing
- **Safety:** Block/unblock, report (user or message), moderation queue auto-created on report
- **Moderation:** AI flagging queue, 4 resolution actions (dismissed/warned/removed/suspended), system messages, parent alerts, original content preservation
- **Parent dashboard:** Managed members, activity indicators, alerts (moderation + flagged messages)
- **Admin:** User management, role changes, invite code management (super_admin only)
- **Session timer:** Preset durations, persists across navigation, break screen overlay
- **Daily mood check-in:** Once per calendar day, sets energy + calm mode
- **Sensory preferences:** CSS body classes for animations/saturation, cached in localStorage
- **Settings:** Accordion layout, sticky sidebar nav, Save All, unsaved-changes modal

For the complete numbered feature list with implementation details, see `git log` or ask me to look up a specific feature.

---

## Key MVP Decisions

1. **1:1 messaging only** — No groups/communities in MVP
2. **AI is background only** — No user-facing AI suggestions
3. **Human + AI moderation** — AI flags, humans decide
4. **Invite-only** — Controlled beta rollout
5. **No payment processing** — MVP is non-monetized
6. **Modular onboarding** — Users can save partial progress
7. **Age verification** — Email + legal declarations (no document uploads)

---

## API Modules Reference

Each controller file (`*.controller.ts`) has the full endpoint list. Swagger docs available at `/api/docs` in dev. Quick summary:

- **Auth** (`/api/auth/`) — register, login, refresh, verify-email, resend-verification, forgot-password, reset-password, accept-terms
- **Users** (`/api/users/`) — me (GET/PATCH), onboarding-status, language, directory, how-to-talk-to-me
- **Preferences** (`/api/preferences/`) — communication, sensory, time-boundaries, conversation-starters
- **State** (`/api/state/`) — current, social-energy, calm-mode activate/deactivate
- **Messaging** (`/`) — conversations CRUD, messages CRUD, read receipts, hide/unhide
- **Safety** (`/`) — blocked-users CRUD, reports
- **Moderation** (`/moderation/`) — queue (list/get/resolve), stats
- **Parent** (`/parent/`) — generate-code, link, members, indicators, alerts
- **Admin** (`/admin/`) — users (list/set-role), invite-codes (list/create)

---

## Database Schema Notes

See `apps/api/prisma/schema.prisma` for the full schema.

### Account Types

- `adult` — Self-managed adult account
- `parent_managed` — Minor account supervised by parent
- `moderator` — Moderation team (bypasses onboarding, excluded from directory)
- `super_admin` — Full admin (all moderator privileges + user management)

### Test Accounts (from seed)

- `mod@test.com` / `Password123!` — moderator
- `admin@test.com` / `Password123!` — super_admin

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

### NestJS Module Structure

```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── dto/
│   └── index.ts
└── guards/ (if needed)
```

### Frontend Guidelines

- Keep UI clean and simple — current Tailwind styling is throwaway, human designer will refine later
- **WCAG 2.1 AA accessibility is a priority** — semantic HTML, proper ARIA, focus management, keyboard navigation
- All user-facing strings go through react-i18next — no hardcoded text
- Use `useAuthGuard` hook for auth redirects (not manual useEffect)
- Use `useApiError` hook for localized error messages
- Use `STORAGE_KEYS` constants from `lib/constants.ts` for localStorage keys

---

## HTML & Accessibility Patterns

This project targets WCAG 2.1 AA. The existing components demonstrate all patterns — reference them when building new UI:

| Pattern                                                | Example file(s)                             |
| ------------------------------------------------------ | ------------------------------------------- |
| Page landmarks (`main`, `aside`, `header`)             | `dashboard/page.tsx`                        |
| Form labels (`htmlFor`/`id`, wrapping labels)          | `StepProfile.tsx`, `StepSensory.tsx`        |
| Radio/checkbox groups (`fieldset`/`legend`)            | `StepProfile.tsx`, `StepCommunication.tsx`  |
| Toggle buttons (`aria-pressed`)                        | `StepCommunication.tsx`, `StatusBar.tsx`    |
| Range inputs (`aria-valuenow`, `output`)               | `StepSensory.tsx`                           |
| Errors/loading (`role="alert"`, `role="status"`)       | `onboarding/page.tsx`, `dashboard/page.tsx` |
| Modals (focus trap, Escape, `aria-modal`)              | `NewConversationModal.tsx`                  |
| Lists (`role="listbox"`, `role="option"`)              | `ConversationList.tsx`, `TagInput.tsx`      |
| Messages (`article`, `time`)                           | `MessageBubble.tsx`                         |
| Decorative elements (`aria-hidden="true"`)             | Throughout                                  |
| Step indicators (`aria-current="step"`, `progressbar`) | `onboarding/page.tsx`                       |

---

## Known Issues & Important Behaviors

### Beta-specific (must revert post-beta)

- **Email verification bypassed:** Registration auto-sets `emailVerified: true` + `status: 'active'` + returns JWT tokens. No verification email sent. Revert in `auth.service.ts` once Resend domain verified.
- **Resend shared domain:** Can only send to `raydickman@gmail.com`. Switch to `noreply@otantist.com` once domain access restored.

### Auth & Session

- **Client-side only route guards:** No Next.js middleware — useEffect-based. Deferred to future enhancement.
- **Login redirect logic:** moderator → `/moderation`, super_admin → `/admin`, parent → `/parent`, default → `/dashboard`
- **Auth rate limits:** `/login` 5/5min, `/register` 3/min, `/refresh` 10/min. Redis-backed with in-memory fallback.

### Moderation

- **Resolution actions:** Dismissed (no impact), Warned (warningCount++, system message, parent alert), Removed (preserves original, replaces content, auto-warns, system message, parent alert), Suspended (disables account, system message to ALL conversations, parent alert)
- **System messages:** Translation keys stored in `message.content`, rendered as centered amber notices in `MessageBubble`
- **Parent alerts:** Created on moderation actions affecting minors AND when reports filed against minors
- **Pending policy decisions:** See `docs/PROJECT_OWNER_QUESTIONS.md`

### Messaging

- **Delete is "delete for me" only:** Creates `MessageDeletion` record, original content preserved
- **Hide conversation:** Auto-unhides on new incoming message
- **Message delivery scheduler:** Cron every 60s for time-boundary queue; event-driven for calm mode deactivation
- **Typing indicators:** Suppressed when recipient has calm mode active

### Role-based Access

- **`@Roles()` decorator + `RolesGuard`** — checks `account.accountType`. No decorator = any authenticated user.
- **`isModerator`** = true for both `moderator` AND `super_admin`
- Moderators + super admins: bypass onboarding, excluded from directory, cannot be messaged
- **Minor protection:** `parent_managed` accounts excluded from directory, cannot be messaged

### Frontend

- **i18n:** `localStorage` only detection, default `'fr'`. User language synced from API on login.
- **Sensory prefs:** CSS body classes (`sensory-no-animations`, `sensory-reduced`, `sensory-minimal`), cached per-user in localStorage
- **Session timer:** `startedAt` in localStorage survives navigation. Resets to Off after break dismissed.
- **French translations need native review:** Error tone, "sécuritaire" vs "sécurisée", gendered "Tuteur", overall warmth. See `public/locales/fr/`.

### Onboarding Flow

1. Register → accept-terms → 5-step onboarding → dashboard
2. Required fields: Profile (`displayName`, `ageGroup`), Communication (`preferredTone`, 1+ `commModes`)
3. Age group boundary lock: minor↔adult switch blocked after onboarding complete
4. Minor (14-17) sees parent linking code input after profile step

---

## Testing

```bash
npm test                    # All tests (107 unit/integration)
npm test -w @otantist/api   # API tests only
npm run verify              # Full pipeline: prisma validate → prettier → builds → tests
npm run test:e2e            # Playwright E2E (14 tests, requires running dev servers)
```

- **E2E details:** `apps/web/e2e/` — login, register, dashboard, messaging, onboarding specs
- **Git hooks:** Pre-commit (lint-staged), pre-push (`npm run verify`)

---

## Production Deployment

### Live URLs

| Service | URL                                             |
| ------- | ----------------------------------------------- |
| **API** | https://otantist-repo-production.up.railway.app |
| **Web** | https://otantist-web.vercel.app                 |

### Infrastructure

| Service          | Provider                                       |
| ---------------- | ---------------------------------------------- |
| API + DB + Redis | Railway                                        |
| Web app          | Vercel (root dir: `apps/web`)                  |
| Email            | Resend (shared domain `onboarding@resend.dev`) |

### Key Env Vars

**Railway:** `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, SMTP vars (Resend), `WEB_URL` (no trailing slash!), `FEEDBACK_EMAIL=info@otantist.com`

**Vercel:** `NEXT_PUBLIC_API_URL=https://otantist-repo-production.up.railway.app`

Full env var list in Railway dashboard. `ANTHROPIC_API_KEY` not set — AI moderation disabled for beta.

### Database Operations (from local PowerShell)

```powershell
$env:DATABASE_URL="postgresql://...@ballast.proxy.rlwy.net:PORT/railway"; npm run db:seed
$env:DATABASE_URL="postgresql://...@ballast.proxy.rlwy.net:PORT/railway"; cd apps/api; npx prisma migrate deploy
```

Use **public** `DATABASE_PUBLIC_URL` from Railway Postgres service, not the internal URL.

### Deployment Gotchas

**Railway:** (1) "Redeploy" replays old snapshot — need git push for fresh code. (2) Uses `npx tsc` not `nest build`. (3) `WEB_URL` must have no trailing slash (CORS). (4) GitHub repo connection can silently break.

**Vercel:** (1) Root dir must be `apps/web`. (2) `husky install || true` in prepare script. (3) Next.js strict TS build. (4) Set env vars before first deploy.

---

## Reference Documents

- `otantistmvpspecification.pdf` — Detailed MVP spec
- `otantisttechnicalarchitecturev2.pdf` — Architecture decisions
- `DEVELOPER_GUIDE.pdf` — Setup and workflow guide
- `docs/PROJECT_OWNER_QUESTIONS.md` — Pending policy decisions (moderation, safety)
- `TESTING_ISSUES.md` — Issues found during live testing
- `TESTER_GUIDE.md` / `TESTER_GUIDE_FR.md` — Beta tester instructions

---

## Session Continuity Rule

**IMPORTANT: Update this file whenever a module, feature, or flow is completed or significantly changed.** Keep the status and known issues sections accurate so new sessions can pick up where the last left off.

---

_Last updated: March 16, 2026 (slimmed down from 966 to ~250 lines; verbose sections replaced with source-of-truth pointers)_
