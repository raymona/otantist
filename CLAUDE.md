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
│   │       ├── messaging/   # ✅ 1:1 messaging, time boundary queuing
│   │       ├── safety/      # ✅ Blocking, reporting
│   │       ├── moderation/  # ✅ AI flagging queue, human review
│   │       ├── parent-dashboard/ # ✅ Indicators, alerts, managed members
│   │       ├── gateway/     # ✅ WebSocket gateway (auth, real-time messaging, presence)
│   │       ├── email/       # ✅ Email service
│   │       └── prisma/      # ✅ Prisma service
│   ├── web/                 # Next.js 16 web app (🔨 IN PROGRESS — auth/onboarding/dashboard built)
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

### 🔨 PHASE 2: Frontend (Web App) — IN PROGRESS

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
9. ✅ Login → accept-terms → onboarding redirect flow (redirects to /dashboard)
10. ✅ Messaging UI (1:1 conversations) — dashboard with split-panel layout
11. ✅ User state UI (social energy, calm mode) — StatusBar component
12. ✅ Dashboard / post-onboarding landing page — /dashboard route
13. ✅ Safety UI — block user (with confirm modal), report user/message, blocked users management
14. ✅ Real-time messaging — Socket.io gateway (auth, message send/receive, typing, presence, state broadcasts) + frontend socket hook with REST fallback
15. ✅ "Delete for me" — per-user message deletion (original content preserved for moderators/other user)
16. ✅ "Hide conversation" — per-user conversation hiding with auto-unhide on new incoming message

### Web App File Structure

```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout (AuthProvider + I18nProvider)
│   ├── page.tsx                # Landing page (redirects authenticated users to /dashboard)
│   ├── dashboard/page.tsx      # ✅ Dashboard with messaging UI
│   ├── login/page.tsx          # ✅ Login with redirect logic (→ /dashboard)
│   ├── register/page.tsx       # ✅ Registration with invite code
│   ├── accept-terms/page.tsx   # ✅ Terms acceptance gate
│   ├── onboarding/page.tsx     # ✅ 5-step onboarding form
│   ├── verify-email/page.tsx   # ✅ Email verification from token link
│   ├── verify-email-sent/page.tsx # ✅ Post-registration confirmation
│   ├── forgot-password/page.tsx   # ✅ Password reset request
│   └── reset-password/page.tsx    # ✅ Password reset with token
├── lib/
│   ├── api.ts                  # ✅ API client + type definitions (request exported)
│   ├── auth-context.tsx        # ✅ Auth context (tokens, user, login/register/logout)
│   ├── constants.ts            # ✅ Shared storage keys (STORAGE_KEYS)
│   ├── i18n.ts                 # ✅ i18next config (FR default, EN, dashboard ns)
│   ├── types.ts                # ✅ Shared TS types for messaging + state + safety APIs
│   ├── messaging-api.ts        # ✅ API client for conversations/messages
│   ├── state-api.ts            # ✅ API client for social energy/calm mode
│   ├── safety-api.ts           # ✅ API client for block/unblock/report
│   ├── use-auth-guard.ts       # ✅ Auth redirect hook (guest/authenticated/onboarded)
│   ├── use-api-error.ts        # ✅ Localized error message hook
│   ├── use-socket.ts           # ✅ Socket.io hook (connection, events, reconnection, REST fallback)
│   └── utils.ts                # ✅ formatRelativeTime helper (uses i18n)
├── components/
│   ├── I18nProvider.tsx        # ✅ i18n wrapper with hydration handling
│   ├── LanguageSwitcher.tsx    # ✅ FR/EN toggle (role="group", aria-current)
│   ├── onboarding/
│   │   ├── TagInput.tsx        # ✅ Reusable tag input (role="list", aria-label)
│   │   ├── StepProfile.tsx     # ✅ Profile step (fieldset/legend, htmlFor/id)
│   │   ├── StepCommunication.tsx # ✅ Communication step (fieldset, aria-pressed)
│   │   ├── StepSensory.tsx     # ✅ Sensory step (output, aria-valuemin/max/now)
│   │   ├── StepConversation.tsx # ✅ Conversation step (composes TagInput)
│   │   └── StepComplete.tsx    # ✅ Completion step (aria-hidden on decorative)
│   └── dashboard/
│       ├── StatusBar.tsx       # ✅ Energy badge, calm mode toggle, blocked users, logout
│       ├── ConversationList.tsx # ✅ Sidebar with conversation items + unread badges
│       ├── ChatView.tsx        # ✅ Message thread + input + load more + block/report
│       ├── MessageBubble.tsx   # ✅ Single message with status indicators + report
│       ├── NewConversationModal.tsx # ✅ Modal to start conversation by user ID
│       ├── BlockConfirmModal.tsx    # ✅ Block confirmation with consequences list
│       ├── BlockedUsersModal.tsx    # ✅ View/unblock users list
│       └── ReportModal.tsx         # ✅ Report user or message (5 reason types)
└── public/locales/{en,fr}/     # ✅ Translation JSON files (auth, onboarding, common, dashboard)
```

### Known Issues & Debugging Notes

- **Field name mismatch (potential):** Frontend login page checks `user.legalAccepted` for redirect logic. Backend returns `legalAccepted` (mapped from `account.legalAcceptedAt`).
- **Client-side only route guards:** No Next.js middleware — all auth checks are useEffect-based, which means brief flash of wrong page before redirect.
- **Duplicate onboarding logic:** Both `UsersService` and `PreferencesService` implement `updateOnboardingProgress()` independently — risk of drift.
- **WebSocket implemented:** Socket.io gateway handles real-time messaging, typing indicators, presence (online/offline), read receipts, delivered status, state change broadcasts, and conversation unhidden events. Frontend falls back to REST when socket is disconnected. Manual refresh button remains as backup.
- **Message deletion is "delete for me" only:** The `DELETE /messages/:id` endpoint no longer overwrites message content. Instead it creates a `MessageDeletion` record — the message disappears from the deleter's view only. Original content is always preserved for moderators and the other user. Both sender and recipient can delete any message in their conversation.
- **Hide conversation:** `POST /conversations/:id/hide` hides from sidebar, auto-unhides when a new message arrives from the other user. `POST /conversations/:id/unhide` to manually restore.

### Login → Onboarding Flow (how it should work)

1. `POST /auth/login` → get tokens + user object
2. Frontend checks `user.termsAcceptedAt` → if null, redirect to `/accept-terms`
3. `/accept-terms` → `POST /auth/accept-terms` → refresh user → redirect to `/onboarding`
4. `/onboarding` → 5 steps, each saves via API with `sectionComplete: true`
5. After final step → `onboardingComplete: true` → redirect to `/` (needs a real destination)

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

_Last updated: February 10, 2026_
