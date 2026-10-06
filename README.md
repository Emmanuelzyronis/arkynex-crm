# Arkynex CRM

Real estate CRM built with **Next.js 16 / React 19 / Tailwind v4**, running on
**Clerk** (auth + billing + multi-user workspaces) + **Neon Postgres** via
**Drizzle ORM** (data) + **Vercel Blob** (files) + **Ably** (realtime) +
**Vercel AI Gateway** (LLM features), deployed on **Vercel**.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the values (see below)
npx drizzle-kit migrate      # apply schema to Neon
npm run dev
```

Open http://localhost:3000.

## Environment

Copy `.env.example` → `.env.local`. Required groups:

| Group | Vars |
|-------|------|
| Clerk | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_BILLING_ENABLED` |
| Neon | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` |
| Blob | `BLOB_READ_WRITE_TOKEN` (optional `NEXT_PUBLIC_BLOB_BASE_URL`) |
| Ably | `ABLY_SERVER_KEY`, `NEXT_PUBLIC_ABLY_CLIENT_KEY` |
| Cron | `CRON_SECRET` |
| AI | `AI_GATEWAY_API_KEY` (or `OPENAI_API_KEY`), `AI_MODEL` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` |
| SMS | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |

With the Vercel project linked, `vercel env pull .env.local` fetches the Neon,
Clerk and Blob values automatically.

## Auth flow (Clerk)

| Route | What happens |
|-------|--------------|
| `/signup` | Clerk `<SignUp/>` → email verification → `/onboarding/profile` |
| `/login` | Clerk `<SignIn/>` → `/dashboard` |
| `/onboarding/*` | Profile → business → goals |

Protected routes are guarded by `proxy.ts` (`clerkMiddleware` — Next 16's
replacement for the deprecated `middleware.ts` convention).

### Workspaces & multi-user team

Every signed-in user has a personal `profiles` row. Data is scoped to a
**workspace** (`profiles.workspaceId`):

- Owners are their own workspace (`workspaceId === userId`).
- When an owner adds a teammate (Settings → Team) and that teammate signs in,
  `resolveAuthContext()` matches their email to the invitation and links their
  profile to the owner's workspace, so they see the same leads, deals and
  pipeline (roles: `owner` / `admin` / `agent`).

`requireUser()` returns the workspace id used to scope all queries/mutations;
`requireAuthContext()` returns the full context; `requireOwnProfileId()` is
used for personal profile edits; `requireWorkspaceAdmin()` guards team actions.

## Billing (Clerk Billing + 15-day trial)

Every new account starts a **15-day free trial** (`profiles.trial_ends_at`,
set on profile creation). `getBillingState()` (`lib/billing/access.ts`) resolves
trial + subscription state; an expired trial redirects `/dashboard` to
`/settings?tab=billing`, and the app shell shows a trial banner.

Subscriptions are handled by **Clerk Billing** (Stripe under the hood):

1. Enable Billing at <https://dashboard.clerk.com> → Billing Settings.
2. Create user Plans with slugs `starter`, `pro`, `agency` (optionally a
   15-day trial per Plan).
3. Set `NEXT_PUBLIC_CLERK_BILLING_ENABLED=true`.

Once enabled, `<PricingTable />` in the Billing settings tab renders the Plans
for checkout, and `has({ plan })` gates access. Until then the tab shows the
plan comparison with checkout marked "coming soon".

## Features

| Area | What it does |
|------|--------------|
| Tasks | Daily follow-up queue at `/tasks` (overdue / today / upcoming / completed); tasks also appear on the dashboard, calendar and each lead. |
| Action plans | One-click follow-up sequences (`Speed to lead`, `2-week nurture`, `Post-viewing`) from a lead record — each step becomes a task. |
| Lead capture | A public hosted form at `${NEXT_PUBLIC_SITE_URL}/f/{token}` captures website enquiries, dedupes by phone, scores the lead and creates a speed-to-lead task. Configure it in Settings → Lead capture (copy link, embed iframe, download HTML). |
| Search | ⌘K / Ctrl-K command palette (`/api/search`) across leads, properties and deals. |
| Export | CSV downloads at `/api/export/leads` and `/api/export/deals` (agent-scoped). |
| Smart lists | Saved, live-counted pipeline views on `/leads` — filter builder for stage, score, source, type, timeline, budget, follow-up age and owner. |
| Team & routing | Team roster + roles in Settings → Team; optional round-robin routing assigns new website leads to the least-loaded active member. |
| Billing sync | `/api/webhooks/clerk` verifies Clerk (Svix) signatures and mirrors subscription events into `subscriptions` + `profiles`. |

## Data layer (Drizzle + Neon)

```
lib/db/schema.ts          # all tables (camelCase props, snake_case columns)
lib/db/index.ts           # neon-http Drizzle client
lib/db/queries/*.ts       # read models (all scoped by agentId)
lib/db/mutations/*.ts     # server actions (create/update/delete)
lib/db/migrations/*.sql   # drizzle-kit migrations
```

No RLS: every query filters by the workspace `agentId` and every mutation calls
`requireUser()` (which now resolves the workspace). Reads of the dashboard and
reports are cached in-process for 60s (`lib/cache.ts`, tag-invalidated on
mutation). A durable `jobs` queue (`lib/queue/*`) adds retries/backoff and is
drained by the consolidated daily cron, or on demand via
`/api/cron/process-jobs`.

## Files (Vercel Blob)

`lib/storage/blob.ts` stores property photos under `properties/{id}/photos/...`
(public blob URLs) and documents under `properties/{id}/documents/...`.
Documents are downloaded through the authenticated
`app/api/documents/[id]/route.ts` proxy, which checks ownership before
streaming the file — the raw blob URL is never exposed to the client.

## Realtime (Ably)

`lib/realtime/ably.ts` publishes events; `app/api/realtime/token/route.ts`
issues scoped tokens to signed-in users. The communications thread and AI-action
bell subscribe client-side. Publishing is a no-op when `ABLY_SERVER_KEY` is unset.

## AI (real LLM)

`lib/ai/llm.ts` is a dependency-free OpenAI-compatible client that calls the
**Vercel AI Gateway** (`AI_GATEWAY_API_KEY`) or OpenAI directly
(`OPENAI_API_KEY`). It powers:

- **AI Actions** — the deterministic heuristics in `lib/ai/generate-actions.ts`
  still decide *which* actions matter (auditable), then the LLM rewrites each
  card's title/body and drafts the suggested message (`personalizeActions`).
- **Draft with AI** — a button in the communications thread (`draftLeadMessage`)
  drafts the next follow-up from the lead's recent thread.

With no key configured, every model call returns `null` and the app falls back to
the pure heuristics — no hard dependency, no runtime errors.

## Email & SMS delivery

`lib/comms/delivery.ts` sends real messages over `fetch` (no SDKs): **Resend**
for email and **Twilio** for SMS. In the communications thread you can switch the
composer between Note / Email / SMS; outbound messages are delivered through the
provider *and* logged on the thread (with `lastContactedAt` updated). When a
provider isn't configured the message is still logged and tagged
"delivery provider not configured".

## Webhooks & cron (Vercel route handlers)

| Route | Purpose |
|-------|---------|
| `/api/documents/[id]` | Authenticated document download proxy |
| `/api/leads/capture` | Public lead-capture endpoint (token-authenticated, CORS + rate-limited) |
| `/api/search` | Signed-in cross-entity search for the ⌘K palette |
| `/api/export/[entity]` | CSV export for `leads` / `deals` |
| `/api/webhooks/clerk` | Clerk Billing webhook (signature-verified) |
| `/api/cron/daily` | The one scheduled cron: fans out AI actions, rescores leads, creates stale-lead tasks, then drains the queue |
| `/api/cron/process-jobs` | Drains the durable queue (callable on demand / every minute on a Pro plan) |
| `/api/cron/generate-ai-actions` | Enqueue AI action generation |
| `/api/cron/score-leads` | Recompute lead scores |
| `/api/cron/stale-lead-tasks` | Create keep-in-touch tasks for quiet leads |

Cron schedules live in `vercel.json`. Protect them by setting `CRON_SECRET`
(Vercel sends it as a bearer token).

> **Plan note:** Vercel Hobby only allows daily cron jobs, so `vercel.json`
> declares a single consolidated `/api/cron/daily` job. On Pro, add
> `/api/cron/process-jobs` with `* * * * *` for near-real-time queue draining.

## Testing

```bash
npm test        # tsc -p tsconfig.test.json && node --test .test-dist/tests/*.test.js
npm run typecheck
```

`tests/` holds dependency-free unit tests (Node's built-in test runner) for the
scoring heuristics, currency formatting, action plans, image helpers and billing
plans. `.github/workflows/ci.yml` runs them on every push/PR.

## Operations notes

- **Database region** — Neon is provisioned in a single region via the Vercel
  integration. To add read replicas / move regions, use the Neon dashboard
  (Project → Branches → Read replicas) or `neonctl`; then point
  `DATABASE_URL_UNPOOLED`/replica URLs at the new endpoint. No app change needed.
- **Custom domain** — add the domain in Vercel (Project → Settings → Domains),
  point DNS, and set `NEXT_PUBLIC_SITE_URL` to it so Clerk redirects and
  lead-capture links use the branded host.

## Deploy (Vercel)

```bash
vercel link --project arkynex-crm
vercel integration add neon --name arkynex-crm     # DATABASE_URL etc.
vercel integration add clerk --name arkynex-crm    # Clerk keys
vercel integration add blob --name arkynex-crm     # BLOB_READ_WRITE_TOKEN
vercel --prod
```

Add the Ably vars with `vercel env add`, then apply migrations to Neon before
the first deploy.
