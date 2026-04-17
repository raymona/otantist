# Otantist — Phase 1 Hosting Stack

A hosting architecture for the MVP web launch, starting from the current deployed state and sized for solo development through ~10K active users with clear migration paths.

---

## Current Deployed Stack (as of April 2026)

This is what's running today. Any changes should be evaluated as migrations from this baseline.

| Layer                     | Service                    | Status                                    |
| ------------------------- | -------------------------- | ----------------------------------------- |
| **Frontend**              | Vercel (apps/web, Next.js) | Deployed, auto-deploys from `main`        |
| **Backend API**           | Railway (apps/api, NestJS) | Deployed, long-lived service              |
| **Database**              | Railway PostgreSQL 15      | Deployed, production data                 |
| **Cache / Rate Limiting** | Railway Redis 7            | Deployed, throttler + health checks       |
| **Email**                 | Resend (HTTP API)          | Live, sending from `noreply@otantist.com` |
| **Real-time**             | Socket.io (via Railway)    | Live, persistent WebSocket connections    |
| **File Storage**          | None yet                   | Planned (Cloudflare R2)                   |
| **Domain**                | `otantist.app` (Vercel)    | Registered, ~$15/yr                       |

### Current monthly cost estimate

| Stage                       | Monthly cost                     |
| --------------------------- | -------------------------------- |
| Solo dev (now)              | ~$10-15 (Railway usage + domain) |
| Closed beta (~50 users)     | ~$20-30                          |
| Public launch, modest usage | ~$40-60                          |
| 10K active users            | ~$120-200                        |

---

## Frontend — Vercel (Hobby -> Pro)

`apps/web` (Next.js) deploys directly from the monorepo. Currently on Hobby (free); upgrade to **Pro ($20/mo)** before public launch for spend management, team features, and commercial-use terms.

CORS is configured in the API to accept `WEB_URL` plus any `*.vercel.app` preview deployment.

**No changes needed.** This is working well.

---

## Backend API — Railway

`apps/api` (NestJS) runs as a long-lived service — required for WebSocket connections (Socket.io messaging), background jobs (message delivery scheduler, time-boundary cron), and the moderation queue.

Railway handles what Vercel cannot: persistent connections, cron jobs, and long-running processes.

**Cost:** ~$5-20/mo ($5 base + usage)

**No changes needed** unless Canadian region hosting becomes a hard requirement (see Data Residency section below).

---

## Database — Railway PostgreSQL 15

Currently running on Railway with Prisma ORM. Production data exists with migrations up to date.

**What works well:**

- Co-located with the API (low latency)
- Included in Railway billing (no separate vendor)
- Simple operational model for a solo developer

**What's missing:**

- **Point-in-time recovery** — Railway's PostgreSQL backups are daily snapshots only. For a platform handling minors' data, more granular recovery is important.
- **Canadian data residency** — Railway currently hosts in US regions. See Data Residency section below.
- **Database branching** — No preview-environment database branching (Neon and Supabase offer this).

**Recommendation:** Stay on Railway PostgreSQL for now. Evaluate migration to **Supabase (Toronto region)** or **Neon** when data residency becomes a launch requirement. This is a database-only migration — Prisma makes the switch straightforward since you'd only change `DATABASE_URL`.

---

## Redis — Railway

Currently running on Railway Redis 7. Used for:

- Rate limiting (throttler backing store via `RedisThrottlerStorage`)
- Health check monitoring
- Graceful fallback to in-memory when Redis is unavailable

**Cost:** Included in Railway usage billing

**Recommendation:** Stay on Railway Redis for now. If you migrate the API off Railway, **Upstash** (serverless Redis, free tier, pay-per-request) is the natural replacement. The existing `RedisModule` would only need a connection string change.

---

## Email — Resend

Sending transactional emails (verification, password reset, parent alerts) via Resend HTTP API from `noreply@otantist.com` (domain verified).

**Cost:** Free tier covers up to 3,000 emails/month; $20/mo beyond that.

**No changes needed.** This was missing from the original stack document but is a critical production service.

---

## File Storage — Cloudflare R2 (planned)

For user-uploaded images, avatars, etc. Not yet implemented.

- **Cloudflare R2:** No egress fees (significant long-term savings), S3-compatible API
- **Vercel Blob:** Simpler to wire up initially but higher cost at scale

**Recommendation:** Cloudflare R2 when file uploads are needed. No egress fees matters for a platform with images.

**Cost:** ~$0-5/mo early on

---

## Monorepo Deployment Structure

Both Vercel and Railway handle the monorepo natively:

```
otantist (monorepo)
  apps/web      -> Vercel  (auto-deploy from main)
  apps/api      -> Railway (auto-deploy from main)
  apps/mobile   -> Expo/EAS Build (future, not deployed to web infra)
  packages/shared -> bundled into both apps/web and apps/api
  packages/ui     -> bundled into apps/web (and later mobile)
```

---

## Key Decision: Canadian Data Residency

This is the most important infrastructure decision ahead of public launch.

### Why it matters

Otantist serves Canadian users (especially Quebec, under **Law 25**) and handles accounts for **minors aged 14+**. Data residency isn't optional for a platform in this space — it's a trust and compliance requirement.

### Current state

- **Railway:** API, PostgreSQL, and Redis all run in **US regions**. Railway offers region selection but Canadian regions are not available — the closest option is US East.
- **Vercel:** Edge network serves static assets globally; the frontend doesn't store user data.
- **Resend:** Email is transient and not subject to the same residency concerns.

### Options for Canadian database hosting

| Option                      | Canadian Region               | Migration Effort                                            | Tradeoffs                                            |
| --------------------------- | ----------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| **Supabase**                | Yes (Toronto, `ca-central-1`) | Medium — change `DATABASE_URL`, verify Prisma compatibility | Separate vendor for DB; adds operational complexity  |
| **Neon**                    | Not currently available       | Medium — same as above                                      | No Canadian region yet; closest is US East           |
| **Self-managed on AWS/GCP** | Yes (`ca-central-1`)          | High — manage your own Postgres                             | Maximum control; significant ops burden for solo dev |

### Recommendation

**If Law 25 compliance is required at launch:** Migrate PostgreSQL to **Supabase (Toronto region)**. This is a connection-string change for Prisma — your schema, migrations, and all application code stay the same. Keep the NestJS API on Railway (US East, closest to Toronto), Redis on Railway, and everything else unchanged.

**If compliance can wait for post-beta:** Stay on Railway for simplicity. Revisit when you have legal guidance on requirements.

**Important: Do NOT adopt Supabase Auth.** Your auth system is fully built and handles Otantist-specific features (4 account types, invite-code registration, terms acceptance gate, age-group boundary locks, parent-child linking, minor protections). Supabase Auth cannot replicate this without significant custom work. Use Supabase as a **database host only**.

---

## Backup & Disaster Recovery

This needs a plan before public launch, especially given minors' data:

| Concern                | Current State                 | Recommended                                                                                    |
| ---------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| **Database backups**   | Railway daily snapshots       | Supabase offers point-in-time recovery on Pro plan ($25/mo); or set up `pg_dump` cron to R2/S3 |
| **Redis**              | No persistence beyond Railway | Acceptable — Redis data is ephemeral (rate limits, cache). Rebuild on restart is fine.         |
| **Email records**      | Resend retains logs           | Sufficient for transactional email                                                             |
| **Code**               | GitHub (source of truth)      | Sufficient                                                                                     |
| **Secrets / env vars** | Railway + Vercel dashboards   | Document all env vars in a secure vault (1Password, etc.) — not just in provider dashboards    |

---

## Estimated Total Monthly Cost by Stage (revised)

| Stage                   | Monthly Cost | What's Running                                                     |
| ----------------------- | ------------ | ------------------------------------------------------------------ |
| Solo dev (now)          | ~$10-15      | Railway (API + Postgres + Redis), Vercel free, Resend free, domain |
| Closed beta (~50 users) | ~$25-40      | Same + Vercel Pro ($20)                                            |
| Public launch           | ~$50-80      | + Supabase Pro if DB migrated ($25), R2 ($0-5)                     |
| 10K active users        | ~$120-200    | Higher Railway/Supabase usage tiers                                |

---

## Summary: Recommended Phase 1 Stack

**Keep what's working, migrate only what compliance requires.**

| Layer        | Service                                  | Action                               |
| ------------ | ---------------------------------------- | ------------------------------------ |
| Frontend     | Vercel                                   | Keep; upgrade to Pro at launch       |
| Backend API  | Railway                                  | Keep                                 |
| Database     | Railway PostgreSQL -> Supabase (Toronto) | Migrate when data residency required |
| Cache        | Railway Redis                            | Keep                                 |
| Email        | Resend                                   | Keep                                 |
| Real-time    | Socket.io via Railway                    | Keep                                 |
| File Storage | Cloudflare R2                            | Add when file uploads needed         |
| Domain       | otantist.app via Vercel                  | Keep                                 |

The guiding principle: **don't rewrite what's built and working.** The only migration worth the effort right now is moving PostgreSQL to a Canadian region — and that's a connection string change, not an architecture change.

---

_Revised April 2026. Costs are estimates based on publicly listed provider pricing and will vary with actual usage._
