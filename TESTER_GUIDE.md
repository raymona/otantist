# Otantist — Tester Guide

Thank you for being an early tester of Otantist. This guide covers everything the app can do and how to test it. Please read it before your first login.

---

## What is Otantist?

Otantist is a private messaging app designed for autistic and neurodivergent people. It is built around comfort and safety — you control how and when you communicate.

This is an early beta. Some things may not be finished, and your feedback helps shape what gets built next.

---

## Test Accounts

All test accounts use the same password: **`Password123!`**

| Email             | Role        | Notes                                                 |
| ----------------- | ----------- | ----------------------------------------------------- |
| `marie@test.com`  | User        | French, fully onboarded                               |
| `alex@test.com`   | User        | English, fully onboarded, has blocked Sam             |
| `sam@test.com`    | User        | English, partial onboarding (stopped at sensory step) |
| `jordan@test.com` | User        | English, fully onboarded                              |
| `mod@test.com`    | Moderator   | Redirects to /moderation on login                     |
| `admin@test.com`  | Super Admin | Redirects to /admin on login                          |
| `parent@test.com` | Parent      | Manages Léo, redirects to /parent on login            |
| `minor@test.com`  | Minor       | Léo — parent-managed account                          |

**Invite codes:** `BETA2024`, `TESTCODE`

---

## What you will need

- An **invite code** (see above, or one provided by the person who invited you)
- An **email address** you can access (for verification)
- A modern web browser (Chrome, Firefox, Safari, Edge)

The app is available at: **https://otantist-web.vercel.app**

---

## Creating your account

1. Go to the app and click **Register**
2. Enter your email address, choose a password, and enter your invite code
3. Check your email for a verification link and click it
4. Read and accept the terms of use
5. Complete your profile setup (5 short steps — you can save and come back if needed)

Once that is done, you will land on your main dashboard.

---

## Setting up your profile (onboarding)

The setup has 5 steps. You can update everything later in Settings.

| Step          | What you do                                                     |
| ------------- | --------------------------------------------------------------- |
| Profile       | Choose a display name and age group                             |
| Communication | Set your preferred tone and messaging style                     |
| Sensory       | Adjust animations and colour intensity                          |
| Availability  | Set the hours when you are available to receive messages        |
| Topics        | Add conversation starters, topics to avoid, and tips for others |

**Required fields:** Display name + age group (Profile step), preferred tone + at least one communication mode (Communication step). Everything else is optional.

---

## Your main dashboard

After setup, you land on the **messaging dashboard**. It has two parts:

- **Left sidebar** — your list of conversations
- **Right panel** — the open conversation

At the top is the toolbar with your name, energy level, and quick links.

---

## Social energy

Social energy shows others how available you are right now. You set it yourself using the coloured circles in the toolbar:

- **High** (green) — happy to chat
- **Medium** (yellow) — available but not fully
- **Low** (red) — prefer not to be contacted right now

This is optional. You can change it at any time or leave it as-is. Other users can see your current energy level.

---

## Calm mode

Calm mode pauses all incoming messages so you are not interrupted. Messages sent to you while calm mode is on will be held and delivered when you turn it off.

- Turn it on or off with the **moon button** in the toolbar
- A **purple banner** appears at the top of the screen when calm mode is active
- Your conversation list will appear dimmed while calm mode is on

---

## Daily check-in

When you open the dashboard each day, a short check-in prompt appears. It asks two things:

- How is your **social energy** right now? (high, medium, or low)
- Would you like to start with **calm mode on**?

This takes about 5 seconds. You can skip it if you prefer. The check-in only appears once per day.

---

## Starting a conversation

1. Click **New conversation** in the left sidebar
2. Search for the person you want to talk to by name
3. Optionally write a first message
4. Click **Start conversation**

You can only message people who have finished setting up their profile.

---

## Inside a conversation

### How to talk to someone

Click the **info button** next to the person's name at the top of the chat. This shows their communication preferences — their preferred tone, topics they enjoy, things to avoid, and tips they have shared.

### Message status

Each message shows a small indicator:

- **Queued** — waiting to be delivered (recipient has calm mode on or is outside their availability hours)
- **Sent** — successfully sent
- **Delivered** — received by their device
- **Read** — they have read it

### Deleting a message

Click **Delete** on any message to remove it from your view. The other person can still see it. This is intentional — it preserves the conversation for the other person.

### Hiding a conversation

Click **Hide conversation** to remove it from your sidebar. To see your hidden conversations, click the **eye icon** in the sidebar header. From the hidden view, you can click **Unhide** next to any conversation to restore it. Hidden conversations also come back automatically if the other person sends you a new message.

---

## Session timer

The session timer is a gentle reminder to take breaks. It does not lock you out.

- Set a duration from the timer bar at the top: **Off**, 15, 20, 25, or 30 minutes
- The timer starts automatically when you send your first message
- When time is running low, the bar turns **amber** (5 minutes left) then **red** (1 minute left)
- When the session ends, a soft screen appears with a reminder to take a breath
- Click **I am ready to continue** when you are ready

The timer resets when you close the screen. Your chosen duration is saved.

---

## Settings

Click your **name** in the toolbar to open Settings. You can update any part of your profile:

- **Profile** — display name, age group, visibility
- **Communication** — tone, messaging modes, rhythm
- **Sensory** — animations, colour intensity
- **Availability** — your hours for each day of the week
- **Conversation starters** — good topics, topics to avoid, tips for others
- **Language** — French or English

Each section saves on its own.

---

## Language

The app is fully available in **French** and **English**. Use the language toggle (FR / EN) in the toolbar to switch at any time. Your choice is saved.

---

## Blocking and reporting

### Blocking

If someone makes you uncomfortable, you can block them. Open your conversation with them and click **Block user**. This will:

- Prevent them from sending you messages
- Archive your conversation with them

You can unblock someone at any time from the **blocked users list** in the toolbar.

### Reporting

To report a user or a specific message, click the **Report** button in the conversation. You can choose a reason (harassment, inappropriate content, spam, safety concern, or other) and add details. Reports go to the moderation team for review.

---

## For parents

If your account is linked to a managed member (minor), you will see a **Parent** button in the toolbar. This takes you to the parent dashboard where you can:

- See your managed member(s) with their relationship and status
- View activity indicators for the last 30 days (energy levels, calm mode usage, message counts)
- View and acknowledge alerts (severity: info, warning, urgent)

**Privacy:** Your member's actual message content is private. Indicators show patterns only (for example, how long calm mode was active), not individual messages. Minor accounts cannot message adult accounts and do not appear in the user directory for adults.

**To test:** Log in as `parent@test.com`. You will see Léo as a managed member with pre-populated indicators and alerts.

---

## For moderators

Moderator accounts are used by the Otantist team to review reports and flagged content.

### What moderators can do

- View the **moderation queue** — items reported by users or flagged by the system
- Filter by status (pending, reviewing, resolved) and priority (low, medium, high, urgent)
- Review item details and related content
- Resolve items with an action (dismissed, warned, removed, suspended) and optional notes
- See moderation stats (pending, reviewing, resolved counts, priority breakdown)

### How it works

- A **badge** in the toolbar shows the count of pending items
- The badge updates every 60 seconds and in real-time when new reports arrive
- Moderators cannot be messaged and do not appear in the user directory
- Moderators bypass the normal onboarding flow

**To test:** Log in as `mod@test.com`. You will land on the moderation page with pre-populated queue items.

---

## For super admins

Super admin accounts have all moderator capabilities plus user management.

### What super admins can do

- View all users in a searchable table (email, name, role, status)
- Change a user's role:
  - **Set Moderator** — gives access to the moderation queue
  - **Set Admin** — gives full admin access (use with care)
  - **Set User** — reverts a moderator or admin to a regular user
- Minor (parent-managed) accounts cannot have their role changed
- Access the moderation queue (same as moderators)

### How it works

- Super admins see an **Admin** link and a **Moderation** link in the toolbar
- The admin page has a search bar and a table of all users with role change buttons
- Role changes require a confirmation dialog
- Super admins bypass onboarding, cannot be messaged, and do not appear in the user directory

**To test:** Log in as `admin@test.com`. You will land on the admin page. Try promoting a user to moderator, then reverting them.

---

## Giving feedback

Your feedback is the most useful thing you can give at this stage. Click the **pencil icon** in the toolbar to open the feedback form. You can choose a category (general, bug report, feature request, or sensory/comfort issue) and write your message.

Things that are especially helpful to hear:

- Anything that felt confusing or unclear
- Anything that felt uncomfortable or overwhelming
- Features you wished existed
- Things that worked well and felt right

---

## Help

Click the **?** button in the toolbar to open the in-app help page. It covers all features with jump navigation and is available in both French and English.

---

## A note on privacy

- Your messages are stored securely
- Your profile is only visible to other registered users
- You control your visibility in Settings
- The Otantist team may review flagged content for moderation purposes only

---

_Otantist Early Beta — Thank you for helping us build something better._
