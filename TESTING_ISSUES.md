# Testing Round Issues

Tracking issues found during live testing. To be addressed after the testing session.

---

## 1. Email verification blocked by Resend shared domain

**Status:** Bypassed for beta testing
**Severity:** Blocker for new testers

Resend's shared domain (`onboarding@resend.dev`) only allows sending to the account owner's email. To send to any recipient, a custom domain must be verified at resend.com/domains.

**Temporary fix:** Auto-set `emailVerified: true` and `status: 'active'` during registration. Users skip the email verification step entirely. Revert this once domain is verified in Resend.

**Post-beta:**

- Verify `otantist.com` domain in Resend (requires DNS access)
- Remove `emailVerified: true` + `status: 'active'` from registration create
- Consider also adding admin manual-verify endpoint as a fallback

---

## 2. New conversations don't appear in real-time (FIXED)

**Status:** Fixed
**Severity:** Medium

When another user starts a new conversation with you, it didn't appear in the conversation list until manual refresh. The `message:new` socket handler only updated existing conversations via `map()` — it never added new ones.

**Fix:** When `message:new` arrives for an unknown conversationId, fetch the full conversation via `GET /conversations/:id` and prepend it to the list.

---

## 3. Typing indicators not suppressed during calm mode (FIXED)

**Status:** Fixed
**Severity:** Medium

When a user is in calm mode, they still see "X is typing..." indicators from other users. Calm mode should suppress all incoming notifications including typing.

**Fix:** Added calm mode check in `handleTyping` gateway handler. If the recipient's `userState.calmModeActive` is true, the typing event is silently dropped.

---

## 4. Queued message status doesn't update for sender (FIXED)

**Status:** Fixed
**Severity:** Medium

When a message is queued (calm mode or time boundaries) and later delivered, the sender's message bubble still shows "queued" status. It should update to sent/delivered/read as those events occur.

**Fix:** Gateway `deliverQueuedMessages` now emits `message:status_update` to the sender's user room when queued messages are delivered. Frontend listens for this event and updates the message bubble status.

---

## 5. Session timer issues (FIXED)

**Status:** Fixed
**Severity:** Low–Medium

### 5a. Timer didn't start reliably — FIXED

Root cause: timer was triggered by message:send event which could miss. Now starts immediately when user picks a duration.

### 5b. Timer should start when user selects a duration — FIXED

Timer now starts immediately when user clicks a duration preset button (15/20/25/30 min). No longer tied to message send.

### 5c. Timer UI needs to be more visible — FIXED

Replaced tiny dropdown with prominent preset buttons. Bigger text, clearer color states. Timer visible on all pages (moved to root layout).

---

## 6. Settings page UX overhaul

**Status:** Open
**Severity:** Medium

The settings page is difficult to navigate — long scrolling page with individual save buttons per section. Needs a UX rethink. Ideas to investigate:

- **Accordion layout** — collapse/expand sections so the page isn't overwhelming
- **Sidebar navigation** — jump links to each section (Profile, Communication, Sensory, etc.)
- **"Save All" button** — single action to save all dirty sections at once, in addition to per-section saves
- **Smarter unsaved changes warning** — instead of just a browser `beforeunload` alert, show a custom modal with three options: "Save All & Leave", "Discard & Leave", "Cancel"

---

## 7. General UI readability and discoverability

**Status:** Open
**Severity:** Medium–High

Overall feedback: UI elements are too small and not intuitive enough for the target audience (neurodivergent users who benefit from clear, obvious affordances).

### 7a. Bigger fonts and buttons across the app

Text and buttons are too small throughout. Need to increase base font sizes and button padding/sizing globally. Buttons should have clearer labels — make it obvious what they do.

### 7b. Settings link not discoverable

Clicking your display name to go to Settings isn't obvious. Need a more explicit "Settings" link or gear icon in the toolbar.

### 7c. "How to talk to me" info button too subtle

The small "i" icon next to the other user's name in chat is hard to notice. Needs to be more prominent — larger icon, a label, or a different visual treatment to make it clear it shows the other person's communication guide.

### 7d. Better use of top-of-page space (desktop focus)

The StatusBar / toolbar area is too compact. We have plenty of horizontal space on desktop — spread things out, make icons and nav items bigger and more readable. Mobile optimization is secondary for now; prioritize desktop layout.

---

## 8. Session timer resets/stops unexpectedly (FIXED)

**Status:** Fixed
**Severity:** High

**Root cause:** Timer lived only in dashboard page — navigating away unmounted the component and killed the interval.

**Fix:** Timer moved to root layout via `SessionTimerProvider` context + `GlobalSessionTimer` component. Timer is now visible and running on every page. `startedAt` timestamp stored in localStorage — on remount/page navigation, remaining time is computed from the stored timestamp, so the countdown resumes seamlessly. If timer expires while on another page, break screen shows on return.

---

## 9. Timer behavior after break screen — UX unclear (FIXED)

**Status:** Fixed
**Severity:** Medium

**Decision:** After dismissing break screen, timer resets to Off. User sees the duration preset buttons again and consciously picks a new session. No auto-restart confusion.

---

## 10. Message action buttons too crowded on hover

**Status:** Open
**Severity:** Low–Medium

The "Delete for me" and "Report message" links that appear on message bubble hover are too cramped and cluttered. Needs a cleaner approach — e.g. a single "..." menu that expands, or better spacing/positioning of the action buttons.

---
