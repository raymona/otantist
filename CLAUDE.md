# CLAUDE.md - Otantist Project Context

## Project Overview

**Otantist** is an emotionally safe, sensory-adapted social platform designed specifically for autistic and neurodivergent individuals. This is an invite-only MVP focused on 1:1 messaging with communication adaptation, sensory controls, and emotional safety systems.

**Platform Type:** Native Mobile App (iOS + Android) + Web Application
**Primary Users:** Autistic individuals (14+), Parents/Guardians
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

```
otantist/
├── apps/
│   ├── api/                 # NestJS backend ✅ COMPLETE
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── auth/        # ✅ Registration, login, JWT, email verify, invite codes
│   │       ├── users/       # ✅ Profile, onboarding status, how-to-talk-to-me
│   │       ├── preferences/ # ✅ Communication, sensory, time boundaries, conversation starters
│   │       ├── state/       # ✅ Social energy, calm mode
│   │       ├── messaging/   # ✅ 1:1 messaging, time boundary queuing, delivery scheduler
│   │       ├── safety/      # ✅ Blocking, reporting
│   │       ├── moderation/  # ✅ AI flagging queue, human review
│   │       ├── parent-dashboard/ # ✅ Indicators, alerts, managed members
│   │       ├── gateway/     # ✅ WebSocket gateway (auth, real-time messaging, presence)
│   │       ├── email/       # ✅ Email service
│   │       └── prisma/      # ✅ Prisma service
│   ├── web/                 # Next.js 16 web app ✅ DEMO-READY
│   └── mobile/              # React Native + Expo (planned)
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

| Service       | URL                                |
| ------------- | ---------------------------------- |
| API           | http://localhost:3001              |
| Swagger Docs  | http://localhost:3001/api/docs     |
| Web App       | http://localhost:3000              |
| Mailhog UI    | http://localhost:8025              |
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

## Current Development Phase

### ✅ PHASE 1: Backend API — COMPLETE

All API modules implemented with controllers, services, DTOs, and JWT authentication.

### ✅ PHASE 2: Frontend (Web App) — DEMO-READY

**Approach:** Clean, simple, functional UI. No heavy design work — a human designer will be involved later. Goal is to create a working demo for non-technical stakeholders to experience the app flow.

**Frontend tech:** Next.js 16, React 19, Tailwind CSS 4, react-i18next. No UI component library or form library — manual validation with Tailwind styling.

**Priority flows and status:**

1. ✅ Registration & login (with invite code)
2. ✅ Email verification (verify-email + verify-email-sent pages)
3. ✅ Accept terms gate page
4. ✅ Onboarding (5-step, split into step components — orchestrator in page.tsx, rendering in components/onboarding/)
5. ✅ Forgot password / reset password flow
6. ✅ i18n setup (EN/FR) with translation files for auth + onboarding
7. ✅ Auth context (JWT token management, refresh, user state)
8. ✅ API client (`lib/api.ts`) with typed endpoints for auth, users, preferences
9. ✅ Login → accept-terms → onboarding redirect flow (redirects to /parent for parent accounts, /dashboard for everyone else)
10. ✅ Messaging UI (1:1 conversations) — dashboard with split-panel layout
11. ✅ User state UI (social energy, calm mode) — StatusBar component
12. ✅ Dashboard / post-onboarding landing page — /dashboard route
13. ✅ Safety UI — block user (with confirm modal), report user/message, blocked users management
14. ✅ Real-time messaging — Socket.io gateway (auth, message send/receive, typing, presence, state broadcasts) + frontend socket hook with REST fallback
15. ✅ "Delete for me" — per-user message deletion (original content preserved for moderators/other user)
16. ✅ "Hide conversation" — per-user conversation hiding with auto-unhide on new incoming message
17. ✅ Message delivery scheduler — `@nestjs/schedule` cron (every 60s) for time-boundary-queued messages + event-driven delivery when calm mode deactivated
18. ✅ User directory — `GET /api/users/directory?search=` endpoint + searchable user list in NewConversationModal (replaces raw UUID input)
19. ✅ Enhanced calm mode visuals — CalmModeBanner (role="status"), sidebar dimming overlay, moon icon next to display name; calm mode + energy state lifted from StatusBar to DashboardPage
20. ✅ Account Settings page — `/settings` route with per-section save, reuses onboarding step components (Profile, Communication, Sensory, Conversation Starters), plus TimeBoundariesEditor and language selector; `beforeunload` warning for unsaved changes; StatusBar display name links to settings
21. ✅ "How to talk to me" guide — Info button in chat header next to display name opens HowToTalkToMeModal showing other user's communication preferences (tone, modes, slow replies, topics, tips); fetches `GET /api/users/:id/how-to-talk-to-me` on demand; focus trap + Escape to close
22. ✅ Parent Dashboard UI — `/parent` route with managed member list, activity indicators table (last 30 days), alerts with severity badges and inline acknowledge; linked from StatusBar nav; empty state for non-parent users
23. ✅ Applied sensory preferences — `SensoryProvider` context fetches sensory prefs, applies CSS body classes (`sensory-no-animations`, `sensory-reduced`, `sensory-minimal`) globally; cached in localStorage for instant re-apply; `useSensory()` hook; settings page calls `refreshSensory()` after save for immediate effect; `@media (prefers-reduced-motion)` also respected
24. ✅ Moderation UI — `/moderation` route with stats panel (pending/reviewing/resolved/total + priority breakdown), filterable queue list (status + priority dropdowns), and detail panel with related content + resolution form (dismissed/warned/removed/suspended + notes); linked from StatusBar nav; bilingual (EN/FR)
25. ✅ Deployment config — `railway.json` for monorepo API deployment; `email.service.ts` supports optional SMTP auth (Resend in prod, Mailhog unchanged locally); `start:prod` runs `prisma migrate deploy` before starting; `.env.example` updated with Resend SMTP vars; i18n language detection fixed to `localStorage` only (first-time visitors now default to FR instead of inheriting browser language)
26. ✅ `isParent` flag — `GET /users/me` now returns `isParent: boolean` (computed from active managed members); exposed in `User` type on frontend; parent accounts redirect to `/parent` on login; parent button in StatusBar hidden for non-parent users
27. ✅ Minor account protection — `parent_managed` accounts excluded from user directory (won't appear in New Conversation search); `startConversation` API blocks direct messaging to `parent_managed` accounts with a 403
28. ✅ In-app Help page — `/help` route with jump nav, bilingual (EN/FR), sections for all features; parent section only shown to parent accounts; accessible from StatusBar (? button)
29. ✅ Tester guide — `TESTER_GUIDE.md` at repo root; standalone markdown guide covering registration through all features; written in plain accessible language for neurodivergent users; ready to send to beta testers before first login

### Web App File Structure

```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout (AuthProvider + I18nProvider + SensoryProvider)
│   ├── page.tsx                # Landing page (redirects authenticated users to /dashboard)
│   ├── dashboard/page.tsx      # ✅ Dashboard with messaging UI
│   ├── settings/page.tsx       # ✅ Account settings (profile, prefs, time boundaries, language)
│   ├── parent/page.tsx         # ✅ Parent dashboard (managed members, indicators, alerts)
│   ├── moderation/page.tsx    # ✅ Moderation queue (stats, queue list, detail + resolve)
│   ├── help/page.tsx           # ✅ Help & guide page (bilingual, jump nav, parent section gated)
│   ├── login/page.tsx          # ✅ Login with redirect logic (→ /parent or /dashboard)
│   ├── register/page.tsx       # ✅ Registration with invite code
│   ├── accept-terms/page.tsx   # ✅ Terms acceptance gate
│   ├── onboarding/page.tsx     # ✅ 5-step onboarding form
│   ├── verify-email/page.tsx   # ✅ Email verification from token link
│   ├── verify-email-sent/page.tsx # ✅ Post-registration confirmation
│   ├── forgot-password/page.tsx   # ✅ Password reset request
│   └── reset-password/page.tsx    # ✅ Password reset with token
├── lib/
│   ├── api.ts                  # ✅ API client + type definitions (request exported)
│   ├── auth-context.tsx        # ✅ Auth context (tokens, user, login/register/logout, language sync)
│   ├── constants.ts            # ✅ Shared storage keys (STORAGE_KEYS)
│   ├── i18n.ts                 # ✅ i18next config (FR default, EN, dashboard + settings ns)
│   ├── types.ts                # ✅ Shared TS types for messaging + state + safety APIs
│   ├── messaging-api.ts        # ✅ API client for conversations/messages
│   ├── state-api.ts            # ✅ API client for social energy/calm mode
│   ├── safety-api.ts           # ✅ API client for block/unblock/report
│   ├── parent-api.ts           # ✅ API client for parent dashboard (members, indicators, alerts)
│   ├── moderation-api.ts       # ✅ API client for moderation (queue, stats, resolve)
│   ├── sensory-context.tsx     # ✅ SensoryProvider + useSensory() hook (body CSS classes)
│   ├── use-auth-guard.ts       # ✅ Auth redirect hook (guest/authenticated/onboarded)
│   ├── use-api-error.ts        # ✅ Localized error message hook
│   ├── use-socket.ts           # ✅ Socket.io hook (connection, events, reconnection, REST fallback)
│   └── utils.ts                # ✅ formatRelativeTime helper (uses i18n)
├── components/
│   ├── I18nProvider.tsx        # ✅ i18n wrapper with hydration handling
│   ├── LanguageSwitcher.tsx    # ✅ FR/EN toggle (role="group", aria-current, persists to API)
│   ├── onboarding/
│   │   ├── TagInput.tsx        # ✅ Reusable tag input (role="list", aria-label)
│   │   ├── StepProfile.tsx     # ✅ Profile step (fieldset/legend, htmlFor/id)
│   │   ├── StepCommunication.tsx # ✅ Communication step (fieldset, aria-pressed)
│   │   ├── StepSensory.tsx     # ✅ Sensory step (output, aria-valuemin/max/now)
│   │   ├── StepConversation.tsx # ✅ Conversation step (composes TagInput)
│   │   └── StepComplete.tsx    # ✅ Completion step (aria-hidden on decorative)
│   ├── settings/
│   │   └── TimeBoundariesEditor.tsx # ✅ 7-day time boundary grid with active toggle
│   └── dashboard/
│       ├── StatusBar.tsx       # ✅ Energy badge, calm mode toggle, blocked users, logout, settings link
│       ├── CalmModeBanner.tsx  # ✅ Purple banner when calm mode active (role="status")
│       ├── ConversationList.tsx # ✅ Sidebar with conversation items + unread badges
│       ├── ChatView.tsx        # ✅ Message thread + input + load more + block/report
│       ├── MessageBubble.tsx   # ✅ Single message with status indicators + report
│       ├── NewConversationModal.tsx # ✅ Modal with searchable user directory
│       ├── BlockConfirmModal.tsx    # ✅ Block confirmation with consequences list
│       ├── BlockedUsersModal.tsx    # ✅ View/unblock users list
│       ├── ReportModal.tsx         # ✅ Report user or message (5 reason types)
│       └── HowToTalkToMeModal.tsx # ✅ Communication guide modal (tone, modes, topics, tips)
│   ├── parent/
│       ├── MemberList.tsx         # ✅ Managed members listbox with relationship/status badges
│       ├── MemberDetail.tsx       # ✅ Indicators table + alerts list for selected member
│       └── AlertItem.tsx          # ✅ Single alert with severity badge + acknowledge button
│   ├── moderation/
│       ├── StatsPanel.tsx         # ✅ Stats cards (pending/reviewing/resolved) + priority badges
│       ├── QueueList.tsx          # ✅ Filterable queue listbox with status/priority dropdowns
│       └── QueueItemDetail.tsx    # ✅ Item detail + related content + resolution form
└── public/locales/{en,fr}/     # ✅ Translation JSON files (auth, onboarding, common, dashboard, settings, parent, moderation, help)
```

### Known Issues & Debugging Notes

- **Client-side only route guards:** No Next.js middleware — auth checks are useEffect-based. Pages already show loading state and `return null` during redirect, so the flash is minimal. True middleware would require switching from localStorage to cookie-based auth — deferred as a future enhancement.
- **WebSocket implemented:** Socket.io gateway handles real-time messaging, typing indicators, presence (online/offline), read receipts, delivered status, state change broadcasts, and conversation unhidden events. Frontend falls back to REST when socket is disconnected. Manual refresh button remains as backup.
- **Message deletion is "delete for me" only:** The `DELETE /messages/:id` endpoint no longer overwrites message content. Instead it creates a `MessageDeletion` record — the message disappears from the deleter's view only. Original content is always preserved for moderators and the other user. Both sender and recipient can delete any message in their conversation.
- **Hide conversation:** `POST /conversations/:id/hide` hides from sidebar, auto-unhides when a new message arrives from the other user. `POST /conversations/:id/unhide` to manually restore.
- **Message delivery scheduler:** `MessageSchedulerService` runs a cron every 60s to deliver time-boundary-queued messages. Calm-mode-queued messages are delivered immediately when the user deactivates calm mode (via `calm_mode.deactivated` event). Both triggers emit `message:new` via Socket.io to recipients.
- **Calm mode visual indicators:** Three indicators: (1) CalmModeBanner between StatusBar and main content, (2) semi-transparent purple overlay on conversation sidebar, (3) moon icon next to display name in StatusBar. Calm mode + social energy state is lifted to DashboardPage and passed as props to StatusBar.
- **Settings page:** Full `/settings` route reuses onboarding step components (StepProfile, StepCommunication, StepSensory, StepConversation). Each section saves independently via its own API endpoint. TimeBoundariesEditor is a new component for time boundary management. `beforeunload` fires when dirty sections exist.
- **Language sync:** Auth context syncs `user.language` → `i18n.changeLanguage()` after login/user fetch (covers new browser/device). LanguageSwitcher persists to API via `usersApi.updateLanguage()` in addition to localStorage. Settings page language save also updates both API and i18n.
- **Sensory preferences applied via CSS body classes:** `SensoryProvider` (wraps app in layout) fetches sensory prefs once authenticated, applies `sensory-no-animations` (disables all transitions/animations), `sensory-reduced` (`saturate(0.6)`), or `sensory-minimal` (`saturate(0.25)`) as CSS classes on `<body>`. Cached in localStorage (`STORAGE_KEYS.SENSORY_PREFS`) for instant re-apply on page load. `useSensory()` hook exposes state + `refreshSensory()`. Settings page calls `refreshSensory()` after saving sensory section for immediate effect. `soundEnabled` is stored in context for future audio features (no UI effect yet). `notificationLimit` / `notificationGrouped` are backend concerns — not applied in UI.
- **Moderation UI:** `/moderation` route accessible to all authenticated users (no role system in MVP). Stats summary at top (4 cards + priority breakdown), then two-panel layout: filterable queue list (status + priority dropdowns) on left, selected item detail + resolution form on right. Resolution actions: dismissed, warned, removed, suspended + optional notes (max 1000 chars). After resolving, stats refresh automatically.
- **isParent flag:** `GET /users/me` computes `isParent` by checking `parentManagedAsParent` relation (active managed members). Parent accounts redirect to `/parent` on login via `useAuthGuard`. Parent button in StatusBar is conditionally rendered (`user?.isParent`). The `parent_managed` account type (used for minors) is separate — those accounts are excluded from the user directory and cannot be messaged directly.
- **Deployment:** Code is production-ready. Remaining steps are manual account setup in Railway (API + PostgreSQL + Redis), Vercel (web app), and Resend (email via smtp.resend.com). See deployment section in commit history for full env var list. Local dev is completely unchanged — Docker + Mailhog + localhost.
- **i18n language detection:** `LanguageDetector` order is `['localStorage']` only. First-time visitors with no saved preference fall back to `'fr'`. Logged-in users get their language synced from `user.language` via `fetchUser()` → `i18n.changeLanguage()`.
- **Help page:** `/help` route uses `useAuthGuard('onboarded')`. Parent section (`sections.parent`) only renders when `user?.isParent`. Uses `help` i18n namespace. Linked from StatusBar with a ? icon button.

### Login → Onboarding Flow (how it should work)

1. `POST /auth/login` → get tokens + user object
2. Frontend checks `user.termsAcceptedAt` → if null, redirect to `/accept-terms`
3. `/accept-terms` → `POST /auth/accept-terms` → refresh user → redirect to `/onboarding`
4. `/onboarding` → 5 steps, each saves via API with `sectionComplete: true`
5. After final step → `onboardingComplete: true` → redirect to `/parent` (if `user.isParent`) or `/dashboard`

### Onboarding Steps (backend progression)

| Step                      | Condition to advance           | API call                                   |
| ------------------------- | ------------------------------ | ------------------------------------------ |
| email_verification        | `account.emailVerified`        | `POST /auth/verify-email`                  |
| legal_acceptance          | `account.legalAcceptedAt` set  | `POST /auth/accept-terms`                  |
| basic_profile             | `displayName` + `ageGroup` set | `PATCH /users/me`                          |
| communication_preferences | `sectionComplete: true`        | `PATCH /preferences/communication`         |
| sensory_preferences       | `sectionComplete: true`        | `PATCH /preferences/sensory`               |
| conversation_starters     | `sectionComplete: true`        | `PATCH /preferences/conversation-starters` |

---

## API Modules Reference

### Auth Module (`/api/auth/`)

| Endpoint               | Method | Description                        |
| ---------------------- | ------ | ---------------------------------- |
| `/register`            | POST   | Register with invite code          |
| `/login`               | POST   | Login, returns JWT + refresh token |
| `/refresh`             | POST   | Refresh access token               |
| `/verify-email`        | POST   | Verify email with token            |
| `/resend-verification` | POST   | Resend verification email          |
| `/forgot-password`     | POST   | Request password reset             |
| `/reset-password`      | POST   | Reset password with token          |
| `/accept-terms`        | POST   | Accept terms (JWT protected)       |

### Users Module (`/api/users/`)

| Endpoint                 | Method | Description                    |
| ------------------------ | ------ | ------------------------------ |
| `/me`                    | GET    | Get current user profile       |
| `/me`                    | PATCH  | Update profile                 |
| `/me/onboarding-status`  | GET    | Get onboarding progress        |
| `/me/language`           | PATCH  | Change language preference     |
| `/directory`             | GET    | Searchable user directory      |
| `/:id/how-to-talk-to-me` | GET    | Get user's communication guide |

### Preferences Module (`/api/preferences/`)

| Endpoint                 | Method    | Description                  |
| ------------------------ | --------- | ---------------------------- |
| `/communication`         | GET/PATCH | Communication preferences    |
| `/sensory`               | GET/PATCH | Sensory preferences          |
| `/time-boundaries`       | GET/PUT   | Time boundaries (all 7 days) |
| `/conversation-starters` | GET/PATCH | Good/avoid topics, tips      |

### State Module (`/api/state/`)

| Endpoint                | Method | Description                |
| ----------------------- | ------ | -------------------------- |
| `/current`              | GET    | Get current user state     |
| `/social-energy`        | PATCH  | Update social energy level |
| `/calm-mode/activate`   | POST   | Activate calm mode         |
| `/calm-mode/deactivate` | POST   | Deactivate calm mode       |

### Messaging Module (`/`)

| Endpoint                      | Method | Description                        |
| ----------------------------- | ------ | ---------------------------------- |
| `/conversations`              | GET    | List conversations                 |
| `/conversations`              | POST   | Start new conversation             |
| `/conversations/:id`          | GET    | Get conversation details           |
| `/conversations/:id/messages` | GET    | Get messages (paginated)           |
| `/conversations/:id/messages` | POST   | Send message                       |
| `/conversations/:id/read`     | POST   | Mark messages as read              |
| `/conversations/:id/hide`     | POST   | Hide conversation from user's list |
| `/conversations/:id/unhide`   | POST   | Unhide conversation                |
| `/messages/:id`               | DELETE | Delete message for current user    |

### Safety Module (`/`)

| Endpoint                 | Method | Description        |
| ------------------------ | ------ | ------------------ |
| `/blocked-users`         | GET    | List blocked users |
| `/blocked-users/:userId` | POST   | Block user         |
| `/blocked-users/:userId` | DELETE | Unblock user       |
| `/reports`               | POST   | Submit report      |

### Moderation Module (`/moderation/`)

| Endpoint             | Method | Description          |
| -------------------- | ------ | -------------------- |
| `/queue`             | GET    | Get moderation queue |
| `/queue/:id`         | GET    | Get queue item       |
| `/queue/:id/resolve` | PATCH  | Resolve queue item   |
| `/stats`             | GET    | Get moderation stats |

### Parent Dashboard Module (`/parent/`)

| Endpoint                                   | Method | Description             |
| ------------------------------------------ | ------ | ----------------------- |
| `/members`                                 | GET    | List managed members    |
| `/members/:id/indicators`                  | GET    | Get activity indicators |
| `/members/:id/alerts`                      | GET    | Get alerts              |
| `/members/:id/alerts/:alertId/acknowledge` | PATCH  | Acknowledge alert       |

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

## Database Schema Notes

### Account Types

- `adult` — Self-managed adult account
- `parent_managed` — Minor account supervised by parent

### Key Tables

- `accounts` — Authentication credentials, invite code used
- `users` — Profile info, onboarding progress
- `parent_managed_accounts` — Parent-child relationships
- `invite_codes` — Beta access control
- `communication_preferences` — Tone, modes, rhythm
- `sensory_preferences` — Animations, colors, notifications
- `time_boundaries` — Available hours per day
- `conversation_starters` — Good/avoid topics, tips
- `user_state` — Social energy, calm mode, online status
- `conversations` — 1:1 chats
- `messages` — Message content with moderation flags
- `message_deletions` — Per-user "delete for me" records (original content preserved)
- `conversation_hidden` — Per-user hidden conversation records (auto-unhide on new message)
- `moderation_queue` — Items for human review
- `parent_alerts` — Notifications to parents

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

### Frontend Guidelines

- Keep UI clean and simple — no heavy design
- Functional over aesthetic for now — current Tailwind styling is throwaway
- Human designer will refine later; HTML must be easy to restyle with CSS
- Focus on demonstrating app flow
- **WCAG 2.1 AA accessibility is a priority** — semantic HTML (main, header, nav, section, article, aside, footer), proper ARIA attributes, focus management, keyboard navigation
- All user-facing strings go through react-i18next — no hardcoded text
- Use `useAuthGuard` hook for auth redirects (not manual useEffect)
- Use `useApiError` hook for localized error messages
- Use `STORAGE_KEYS` constants from `lib/constants.ts` for localStorage keys

---

## HTML & Accessibility Patterns

This project targets WCAG 2.1 AA. The current Tailwind classes are throwaway — the HTML structure is what matters. Future devs should follow these patterns so the markup remains semantic, accessible, and easy to restyle with CSS.

### Page layout — use landmarks, not divs

```tsx
// ✅ Good — screen readers can navigate by landmark
<main className="...">
  <header>
    <h1>{t('common:app_name')}</h1>
  </header>
  <aside>  {/* sidebar */} </aside>
  <section> {/* primary content */} </section>
</main>

// ❌ Bad — screen readers see a flat wall of divs
<div className="...">
  <div>
    <div>Otantist</div>
  </div>
  <div> {/* sidebar */} </div>
  <div> {/* primary content */} </div>
</div>
```

See `dashboard/page.tsx` for the full pattern: skip link, `<aside>` for conversation list, `<main>` wrapping the whole view.

### Forms — always associate labels with inputs

```tsx
// ✅ Good — htmlFor/id links label to input; screen readers announce the label
<label htmlFor="display-name" className="...">
  {t('display_name')}
</label>
<input id="display-name" type="text" ... />

// ✅ Also good — wrapping label (no id needed)
<label className="...">
  <span>{t('enable_animations')}</span>
  <input type="checkbox" ... />
</label>

// ❌ Bad — input has no accessible name
<span className="...">{t('display_name')}</span>
<input type="text" ... />
```

See `StepProfile.tsx` for text/select inputs, `StepSensory.tsx` for checkboxes.

### Radio/checkbox groups — use fieldset + legend

```tsx
// ✅ Good — groups related controls with a group label
<fieldset>
  <legend className="...">{t('profile_visibility')}</legend>
  <div className="...">
    {options.map((v) => (
      <label key={v}>
        <input type="radio" name="visibility" ... />
        <span>{t(`visibility_${v}`)}</span>
      </label>
    ))}
  </div>
</fieldset>

// ❌ Bad — no group context for screen readers
<div>
  <span>{t('profile_visibility')}</span>
  {options.map((v) => (
    <label key={v}>
      <input type="radio" ... />
      <span>{t(`visibility_${v}`)}</span>
    </label>
  ))}
</div>
```

See `StepProfile.tsx` (visibility radios), `StepCommunication.tsx` (tone selection).

### Toggle buttons — use aria-pressed

```tsx
// ✅ Good — screen reader announces "Text, toggle button, pressed"
<button
  type="button"
  aria-pressed={commModes.includes(mode)}
  onClick={() => onToggle(mode)}
>
  {t(`comm_mode_${mode}`)}
</button>

// ❌ Bad — screen reader just says "Text, button" with no state
<button type="button" onClick={() => onToggle(mode)}>
  {t(`comm_mode_${mode}`)}
</button>
```

See `StepCommunication.tsx` (comm modes), `StatusBar.tsx` (calm mode toggle).

### Range inputs — use aria attributes + output element

```tsx
// ✅ Good — announces range boundaries, current value, and purpose
<label htmlFor="notification-limit">{t('notification_limit')}</label>
<p id="notification-limit-desc">{t('notification_limit_desc')}</p>
<input
  id="notification-limit"
  type="range"
  min="0" max="20"
  value={notificationLimit}
  aria-describedby="notification-limit-desc"
  aria-valuenow={notificationLimit}
  aria-valuemin={0}
  aria-valuemax={20}
/>
<output>{notificationLimit}</output>

// ❌ Bad — no label association, no description, plain div for value
<span>{t('notification_limit')}</span>
<input type="range" ... />
<div>{notificationLimit}</div>
```

See `StepSensory.tsx`.

### Errors and loading — use role="alert" and role="status"

```tsx
// ✅ Good — screen reader announces the error immediately when it appears
{
  error && (
    <p role="alert" className="...">
      {error}
    </p>
  );
}

// ✅ Good — screen reader announces politely (doesn't interrupt)
{
  resumed && (
    <p role="status" className="...">
      {t('resume_message')}
    </p>
  );
}

// ✅ Good — loading spinner has text for screen readers
<p role="status">
  <span className="sr-only">{t('common:loading')}</span>
</p>;

// ❌ Bad — screen reader ignores the error
{
  error && <div className="text-red-600">{error}</div>;
}
```

See `onboarding/page.tsx` (error + resume messages), `dashboard/page.tsx` (loading state).

### Modals — focus trap, Escape, aria-modal

```tsx
// ✅ Good — full dialog pattern
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">{t('new_conversation')}</h2>
  <input autoFocus ... />        {/* auto-focus first interactive element */}
  <button onClick={onClose}>    {/* close button */}
  {/* onKeyDown handler: Escape closes, Tab cycles within modal */}
</div>

// ❌ Bad — no dialog role, no focus management, no keyboard support
<div className="modal">
  <h2>{t('new_conversation')}</h2>
  <input ... />
</div>
```

See `NewConversationModal.tsx` for the complete focus trap + Escape handler.

### Lists — use semantic list elements

```tsx
// ✅ Good — screen reader announces "list, 3 items"
<ul role="listbox" aria-label={t('conversations')}>
  {conversations.map((c) => (
    <li key={c.id} role="option" aria-selected={c.id === selectedId}>
      ...
    </li>
  ))}
</ul>

// ✅ Good — tag list with accessible remove buttons
<ul role="list" className="...">
  {tags.map((tag, i) => (
    <li key={i} role="listitem">
      {tag}
      <button type="button" aria-label={`${t('remove')} ${tag}`}>&times;</button>
    </li>
  ))}
</ul>

// ❌ Bad — divs with no list semantics
<div>
  {items.map((item) => <div key={item.id}>...</div>)}
</div>
```

See `ConversationList.tsx` (listbox), `TagInput.tsx` (tag list with labeled remove buttons).

### Messages — use article + time

```tsx
// ✅ Good — each message is a self-contained unit with a machine-readable timestamp
<article aria-label={t('message_from', { name })}>
  <p>{content}</p>
  <time dateTime={createdAt}>{formatRelativeTime(createdAt, t)}</time>
</article>

// ❌ Bad
<div>
  <div>{content}</div>
  <span>{formatRelativeTime(createdAt, t)}</span>
</div>
```

See `MessageBubble.tsx`.

### Decorative elements — hide from screen readers

```tsx
// ✅ Good — screen reader skips the decorative icon
<span aria-hidden="true">&#10003;</span>
<svg aria-hidden="true">...</svg>

// ❌ Bad — screen reader tries to announce the SVG paths
<svg>...</svg>
```

### Step indicators — use ordered list + aria-current

```tsx
// ✅ Good — screen reader knows it's a numbered sequence and which step is active
<nav aria-label={t('step', { current: 2, total: 4 })}>
  <ol>
    <li aria-current="step">2</li>  {/* active step */}
    <li>3</li>
  </ol>
  <div role="progressbar" aria-valuenow={2} aria-valuemin={1} aria-valuemax={4}>
    <div style={{ width: '50%' }} />
  </div>
</nav>

// ❌ Bad — divs with no sequence or progress info
<div>
  <div>2</div><div>3</div>
</div>
<div><div style={{ width: '50%' }} /></div>
```

See `onboarding/page.tsx`.

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

### Git Hooks (Husky)

- **Pre-commit:** Runs `lint-staged` (prettier + eslint on staged files)
- **Pre-push:** Runs full test suite (`npm test`)

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

- `otantistmvpspecification.pdf` — Detailed MVP spec
- `otantisttechnicalarchitecturev2.pdf` — Architecture decisions
- `DEVELOPER_GUIDE.pdf` — Setup and workflow guide
- `Otantist___User_Registration_Flow_Solo__Dyade.png` — Registration flow diagram

---

## Session Continuity Rule

**IMPORTANT: Update this file whenever a module, feature, or flow is completed or significantly changed.** Keep the "Current Development Phase" and "Known Issues" sections accurate so that new sessions can pick up where the last one left off. When completing work, update the relevant status markers (pending/in-progress/complete) and add any new known issues or context that would help resume work after a crash or new session.

---

_Last updated: February 22, 2026 (deployment config, isParent flag, minor protection, help page, tester guide)_
