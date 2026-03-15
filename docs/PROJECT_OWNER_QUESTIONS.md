# Project Owner Questions — Moderation & Safety Policy

These are product/policy decisions that need input from the project owner before implementation. They relate to the moderation workflow and user safety systems.

---

## 1. Warning System / Strike Policy

**Currently:** Moderators can issue warnings (manually or auto-triggered by message removal). Warning count is tracked per user but has no automated consequences.

**Questions:**

- Should there be an automatic escalation after N warnings (e.g. 3 strikes = auto-suspension)?
- Does the count reset over time (e.g. warnings expire after 6 months)?
- Should different warning types carry different weight (e.g. safety concern vs. spam)?
- Should the user see their own warning count somewhere in the app?

---

## 2. Suspension & Reinstatement

**Currently:** Suspended accounts cannot log in, refresh tokens, or connect via WebSocket. There is no built-in reinstatement flow — only a super_admin can manually change the account status via database or a custom admin action.

**Questions:**

- Who should be able to reinstate a suspended account? (Super admin only? Any moderator?)
- Should there be a cool-down period before reinstatement is possible?
- Should there be a formal appeal process? (e.g. a form the user can submit, or an email address?)
- Should the user receive an email explaining the suspension and how to appeal?
- Are there different severity levels of suspension? (Temporary with auto-reinstatement after N days vs. permanent?)

---

## 3. Parent–Moderator Communication

**Currently:** Parents receive alerts on their dashboard when their child's content is flagged or when moderators take action. There is no communication channel between parents and moderators.

**Questions:**

- Should parents be able to respond to alerts or contact the moderation team directly?
- If yes, should this be a messaging channel within the app, or external (email, feedback form)?
- What information can moderators share with parents about incidents involving other users? (Privacy implications)
- Should parents be able to contest or appeal moderation decisions on behalf of their child?
- Should parents have visibility into the specific content that was flagged, or just a summary?

---

## 4. User-Facing Warning Communication

**Currently (just implemented):** When a warning or removal happens, a system message appears in the relevant conversation. The tone is gentle and refers users to the feedback form.

**Questions:**

- Should warned users see exactly what they were warned about, or just a general notice?
- Should there be a dedicated "My Warnings" section in Settings where users can review their history?
- For neurodivergent users, is the current phrasing clear enough? Should we offer a more detailed explanation of why the content was flagged?
- Should there be a link to specific community guidelines (which would need to be written)?

---

## 5. Community Guidelines

**Currently:** No formal community guidelines document exists. The moderation system references "community guidelines" in warning messages.

**Questions:**

- Who will write the community guidelines? (Project owner, legal team, accessibility consultant?)
- Should guidelines be built into the app (a `/guidelines` page) or external?
- Should guidelines be part of the onboarding/terms acceptance flow?
- Should guidelines be written in a neurodivergent-friendly format (concrete examples, clear dos/don'ts, visual aids)?

---

## 6. Email Notifications for Moderation Actions

**Currently:** No email notifications are sent for moderation actions. Email verification is bypassed during beta because the sending domain isn't fully configured.

**Questions:**

- Once email is live, which moderation events should trigger emails?
  - Report filed (to reporter confirming receipt?)
  - Warning issued (to warned user?)
  - Message removed (to message author?)
  - Suspension (to suspended user, with appeal instructions?)
  - All of the above to parents of managed minors?
- Should there be an email preference toggle (opt out of moderation emails)?

---

## 7. Reporter Notification

**Currently:** Users who submit reports receive no follow-up about the outcome. They see a success message when the report is submitted, but nothing after.

**Questions:**

- Should reporters be notified when their report is resolved?
- If yes, how much detail? ("Your report was reviewed and action was taken" vs. specific action?)
- Should this be an in-app notification, email, or both?

---

_Document created: March 15, 2026_
_To be discussed with the project owner before next implementation phase._
