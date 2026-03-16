# Testing Issues Tracker

Live document tracking issues found during testing. Organized by area.

**Legend:** ✅ Fixed | ⏳ Workaround in place | ❌ Open

---

## Email & Verification

### 1. Email verification blocked by Resend shared domain ⏳

**Found:** Testing round 1
**Severity:** Blocker for new testers
**Status:** Bypassed for beta — must revert post-beta

Resend's shared domain (`onboarding@resend.dev`) only allows sending to the account owner's email (`raydickman@gmail.com`). Custom domain required to send to any recipient.

**Current workaround:** Registration auto-sets `emailVerified: true` + `status: 'active'` and returns JWT tokens (auto-login). No verification email is sent. Users go straight to accept-terms → onboarding.

**Post-beta TODO:**

- Verify `otantist.com` domain in Resend (requires DNS access)
- Revert `emailVerified: true` + `status: 'active'` in `auth.service.ts` registration
- Revert token generation in registration (return `{ accountId, verificationSent }` instead)
- Frontend `register/page.tsx` will correctly redirect to `/verify-email-sent` when `emailVerified` is false
- Consider adding admin manual-verify endpoint as a fallback

---

## Real-time & Messaging

### 2. New conversations don't appear in real-time ✅

**Found:** Testing round 1 | **Fixed:** Feb 2026

When another user starts a conversation, it didn't appear until manual refresh. `message:new` socket handler only updated existing conversations.

**Fix:** When `message:new` arrives for an unknown conversationId, fetches full conversation via API and prepends to list.

### 3. Typing indicators not suppressed during calm mode ✅

**Found:** Testing round 1 | **Fixed:** Feb 2026

Users in calm mode still saw typing indicators.

**Fix:** Gateway `handleTyping` checks `userState.calmModeActive` — silently drops typing events for calm mode recipients.

### 4. Queued message status doesn't update for sender ✅

**Found:** Testing round 1 | **Fixed:** Feb 2026

Queued messages (calm mode / time boundaries) stayed as "queued" after delivery.

**Fix:** Gateway emits `message:status_update` to sender when queued messages are delivered. Frontend updates bubble status.

---

## Session Timer

### 5. Timer didn't start reliably / tied to message send ✅

**Found:** Testing round 1 | **Fixed:** Feb 2026

Timer was triggered by message send event which could miss.

**Fix:** Timer starts immediately when user picks a duration preset (15/20/25/30 min). No longer tied to message send.

### 6. Timer resets on page navigation ✅

**Found:** Testing round 1 | **Fixed:** Feb 2026

Timer lived only in dashboard page — navigating away killed it.

**Fix:** Moved to root layout via `SessionTimerProvider` + `GlobalSessionTimer`. `startedAt` timestamp in localStorage — countdown resumes on any page.

### 7. Timer behavior after break screen unclear ✅

**Found:** Testing round 1 | **Fixed:** Feb 2026

**Decision:** After dismissing break screen, timer resets to Off. User sees preset buttons and consciously picks a new session.

### 8. Timer UI too subtle ✅

**Found:** Testing round 1 | **Fixed:** Feb 2026

**Fix:** Replaced tiny dropdown with prominent preset buttons. Bigger text, clearer color states (blue → amber@5min → red@1min). Visible on all pages.

---

## Settings Page

### 9. Settings page difficult to navigate ✅

**Found:** Testing round 1 | **Fixed:** Mar 2026

Long scrolling page with individual save buttons. Overwhelming for users.

**Fix:** Accordion layout (collapse/expand sections), sticky sidebar navigation with jump links, "Save All" button in sticky header, custom unsaved-changes modal (Save & leave / Discard & leave / Stay). Only Profile section expanded on load.

---

## UI Readability & Discoverability

### 10. Fonts and buttons too small ✅

**Found:** Testing round 1 | **Fixed:** Mar 2026

**Fix:** `globals.css` base `font-size: 15px`, `cursor: pointer` on buttons/links, component-level sizing via Tailwind. Bigger energy dots, larger padding/spacing in StatusBar and ChatView.

### 11. Settings link not discoverable ✅

**Found:** Testing round 1 | **Fixed:** Mar 2026

Clicking display name to reach settings wasn't obvious.

**Fix:** Explicit gear icon (Cog6Tooth) Settings link in StatusBar. Display name is plain text.

### 12. "How to talk to me" button too subtle ✅

**Found:** Testing round 1 | **Fixed:** Mar 2026

Small "i" icon next to user name in chat was easy to miss.

**Fix:** Prominent blue button with icon + text label ("How to talk to [name]").

### 13. StatusBar too compact on desktop ✅

**Found:** Testing round 1 | **Fixed:** Mar 2026

**Fix:** Bigger icons (h-5 w-5), larger nav button padding, `flex-wrap` on header, more spacing throughout.

### 14. Message action buttons too crowded ✅

**Found:** Testing round 1 | **Fixed:** Mar 2026

"Delete for me" and "Report" links on hover were cramped.

**Fix:** "..." dropdown menu replaces inline hover links. Click-outside and Escape handling.

---

## Registration Flow

### 15. Registration redirects to verify-email-sent during beta ✅

**Found:** Mar 16, 2026 | **Fixed:** Mar 16, 2026

Frontend always redirected to `/verify-email-sent` after registration, even though email was auto-verified.

**Fix:** (a) Backend returns JWT tokens when email already verified (beta). (b) Frontend checks `emailVerified` — goes to `/accept-terms` if true, `/verify-email-sent` if false.

---

_Last updated: March 16, 2026_
