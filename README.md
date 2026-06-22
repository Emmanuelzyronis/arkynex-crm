# Arkynex CRM

Real estate CRM built with Next.js 16 / React 19 / Tailwind v4 / Supabase / Recharts.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## ⚠️ Before you start — required one-time setup

See **`GOOGLE_OAUTH_SETUP.md`** for the complete checklist.

**Critical steps:**
1. Set your Supabase **Site URL** → `http://localhost:3000`
2. Add **Redirect URL** → `http://localhost:3000/auth/callback`
3. Enable **Google provider** in Supabase with your Google Cloud credentials
4. Your `.env.local` is already populated with the project keys

## Auth flow

| Route | What happens |
|-------|-------------|
| `/signup` | Email/password or Google OAuth → email verification → `/onboarding/profile` |
| `/login` | Sign in → `/dashboard` |
| `/forgot-password` | Sends reset email |
| `/auth/callback` | Handles Google OAuth + email confirmation |
| `/auth/reset-password` | New password after reset link |
| `/auth/verify-email` | Holding page after email signup |

Protected routes redirect to `/login` when unauthenticated.  
Onboarding is enforced by the app layout — incomplete profiles are redirected to the right step.

## Data layer

```
lib/supabase/
 ├─ client.ts          browser (Client Components)
 ├─ server.ts          server (Server Components, Actions)
 ├─ middleware.ts       session refresh
 ├─ types.ts           generated from realestate-crm schema
 ├─ actions/
 │   ├─ auth.ts        loginWithEmail, signupWithEmail, loginWithGoogle, signout
 │   └─ onboarding.ts  saveProfileStep, saveBusinessStep, saveWhatsAppStep, saveGoalsStep
 ├─ queries/
 │   ├─ leads.ts       getLeads, getLead
 │   ├─ properties.ts  getProperties, getProperty, getPhotoUrl, getDocumentUrl
 │   ├─ viewings.ts    getViewings, getViewing
 │   ├─ deals.ts       getDeals, getDeal
 │   ├─ communications.ts  getConversations, getThread
 │   ├─ ai-actions.ts  getAIActions
 │   ├─ dashboard.ts   getAllDashboardData (stats, funnel, revenue, sources, viewings, actions)
 │   └─ reports.ts     getAllReportData (stats, revenue trend, deal stages, viewing outcomes, top properties)
 └─ mutations/
     ├─ leads.ts       createLead, updateLeadStage (+ history), archiveLead, deleteLead
     ├─ properties.ts  createProperty, updateProperty, deleteProperty, uploadPropertyPhotos,
     │                 deletePropertyPhoto, uploadPropertyDocument, deletePropertyDocument
     ├─ viewings.ts    createViewing, updateViewingStatus
     ├─ deals.ts       createDeal, updateDealStatus, logOffer, deleteDeal
     ├─ communications.ts  logNote, logCall, logWhatsApp
     ├─ ai-actions.ts  completeAction, dismissAction
     └─ settings.ts    saveProfile, saveWhatsAppSettings
```

## Storage

Two Supabase Storage buckets (already configured by the migration):
- `property-photos` — **public**, photos visible without auth
- `property-documents` — **private**, signed URLs (60min) for title docs etc.

Upload path convention: `{agent_id}/{property_id}/{filename}`

## App routes

All inside `app/(app)/` — share a sidebar + topbar via `DashboardShell`.

| Route | What it does |
|-------|-------------|
| `/dashboard` | Stats, funnel, revenue chart, lead sources, viewings, AI actions (all real data) |
| `/leads` | Searchable list; click row → `/leads/:id` |
| `/leads/new` | Create lead form → Supabase insert |
| `/leads/:id` | Detail: info, stage mover (+ history), archive/delete |
| `/properties` | Grid with real photos; click card → `/properties/:id` |
| `/properties/new` | Create property form → Supabase insert |
| `/properties/:id` | Detail: inline edit, photo upload/delete, document upload/download/delete |
| `/viewings` | Agenda grouped Today/Tomorrow/This Week/Past; mark attended/no-show/cancelled inline |
| `/viewings/new` | Schedule form; lead + property from DB |
| `/deals` | Kanban board with move/delete actions |
| `/deals/new` | Create deal form; lead + property from DB |
| `/communications` | Conversation list + compose note/WhatsApp; thread shows after page reload |
| `/ai-actions` | Priority-grouped actions; complete/dismiss via Server Actions |
| `/reports` | Stats, 12-month revenue, deal stages, viewing outcomes, top properties (all real data) |
| `/calendar` | Month grid; navigable via `?year=&month=` URL params; viewings from DB |
| `/settings` | Profile (saves to DB), WhatsApp (saves to DB), billing (UI), notifications (UI) |
| `/help` | Category cards, searchable FAQ |

## Deploying

1. Set `NEXT_PUBLIC_SITE_URL` in your hosting provider's env vars to your production URL
2. Add `https://yourdomain.com/auth/callback` to Supabase Redirect URLs
3. Add `https://yourdomain.com/auth/callback` to Google Cloud Console authorized redirect URIs
4. `npm run build` — all pages are either statically generated or server-rendered, no special config needed

## What's new in this pass

### WhatsApp — pairing-code approach (no Meta dev account needed per agent)
- `lib/supabase/mutations/whatsapp.ts` — generatePairingCode, verifyPairingCode, disconnectWhatsApp
- `app/api/webhooks/whatsapp/route.ts` — Meta webhook receiver: handles pairing codes,
  routes inbound messages to the right agent's lead, logs unmatched numbers
- `components/settings/whatsapp-section.tsx` — full pairing UI with live countdown +
  auto-polling (no manual refresh needed once connected)
- See `WHATSAPP_SETUP.md` for the complete Meta Cloud API + pairing flow guide

### Paystack billing
- `app/api/webhooks/paystack/route.ts` — handles charge.success, subscription.create,
  subscription.disable, invoice.payment_failed
- `app/api/billing/paystack-callback/route.ts` — verifies payment, saves customer code
- `lib/supabase/mutations/billing.ts` — initializePaystackPayment, cancelPaystackSubscription
- Billing tab in Settings now has real "Subscribe" buttons per plan

### Supabase Realtime
- `components/communications/realtime-thread.tsx` — live message updates via
  `postgres_changes` subscription (no polling, no manual refresh)
- `components/dashboard/live-action-bell.tsx` — topbar bell updates live as new
  AI actions are generated or completed

### Mobile + error handling
- `components/dashboard/mobile-tab-bar.tsx` — bottom tab bar (Home/Leads/Properties/
  Viewings/Deals) shown below `lg`, alongside the existing slide-over sidebar drawer
- `app/(app)/loading.tsx` + 12 per-route `loading.tsx` files — skeleton loaders
  matching each page's real layout (`components/ui/skeleton.tsx`)
- `app/(app)/error.tsx` — catches Server Component errors with retry
- `app/not-found.tsx` + `app/(app)/not-found.tsx` — branded 404s

### Lead edit + AI/scoring Edge Functions
- `/leads/:id/edit` — full edit form, pre-filled from DB
- `supabase/functions/generate-ai-actions/` — nightly cron generates actions from
  stale leads, upcoming/past viewings, stalled deals, new leads
- `supabase/functions/score-lead/` — real-time 0-100 scoring on every lead change
  (completeness, timeline, budget, source, stage, recency)
- See `EDGE_FUNCTIONS_SETUP.md` for deployment + cron scheduling

## Required env vars for this pass

```env
# WhatsApp
WHATSAPP_APP_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
NEXT_PUBLIC_PLATFORM_WA_NUMBER=

# Paystack
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
NEXT_PUBLIC_PAYSTACK_PLAN_STARTER=
NEXT_PUBLIC_PAYSTACK_PLAN_PRO=
NEXT_PUBLIC_PAYSTACK_PLAN_AGENCY=

# Required for both webhooks + Edge Functions
SUPABASE_SERVICE_ROLE_KEY=
```
