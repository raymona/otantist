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

## 4. Queued message status doesn't update for sender

**Status:** Open
**Severity:** Medium

When a message is queued (calm mode or time boundaries) and later delivered, the sender's message bubble still shows "queued" status. It should update to sent/delivered/read as those events occur.

---

## 5. Session timer issues

**Status:** Open
**Severity:** Low–Medium

Three sub-items:

### 5a. Timer didn't start reliably

Timer didn't start for one user on conversation start, but then did on another message send. May be a race condition or event listener issue. Needs investigation.

### 5b. Timer should start when user selects a duration, not on message send

Current behavior: timer auto-starts on first `message:send` socket emit. Desired behavior: timer starts immediately when the user picks a duration (15/20/25/30 min). Simpler and more predictable.

### 5c. Timer UI needs to be more visible

The timer bar is too small and easy to miss. Needs a bigger, more prominent design. Investigate different layout/styling options.

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

## 8. Session timer resets/stops unexpectedly

**Status:** Open
**Severity:** High

One user's timer stopped running while the other user's kept going. Suspected cause: navigating to settings or other pages resets the timer. The timer is currently frontend-only (localStorage + React state), so any component unmount or page navigation could kill it.

**Needs:**

- Investigate what causes the timer to reset (page navigation, settings visit, component remount, etc.)
- Timer should persist visually and functionally regardless of what the user is doing — navigating pages, opening modals, visiting settings, etc.
- Consider moving timer state to the backend so it truly survives any frontend disruption

---

## 9. Timer behavior after break screen — UX unclear

**Status:** Open
**Severity:** Medium

When the timer hits zero and the user clicks "I'm ready to continue", what should happen next? Current behavior restarts with the same duration, but the UX isn't clear. Options to consider:

- **Reset to "Off"** — user has to consciously pick a new duration each session
- **Restart same duration automatically** — seamless but the user might not realize a new timer started
- **Show a choice** — "Start another 20 min?" / "Turn off timer" / pick a new duration
- **Rethink the timer UI entirely** — maybe a simple on/off toggle with a visible duration selector, rather than the current bar approach. Something that makes the current state (running, paused, off) immediately obvious

Should be considered alongside issues #5b (when timer starts), #5c (timer visibility), and #8 (timer persistence).

---

## 10. Message action buttons too crowded on hover

**Status:** Open
**Severity:** Low–Medium

The "Delete for me" and "Report message" links that appear on message bubble hover are too cramped and cluttered. Needs a cleaner approach — e.g. a single "..." menu that expands, or better spacing/positioning of the action buttons.

---
