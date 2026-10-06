# Arkynex CRM: Supabase → Neon + Clerk Migration Plan

**Status:** Phase 2 core layers built — queries/mutations written, auth helper migrated  
**Branch:** `main` (default)  
**Date:** Oct 5, 2026  

## Target Stack

| Component | Current | Target | Status |
|-----------|---------|--------|--------|
| **Auth** | Supabase (email/Google OAuth) | Clerk (managed, OAuth intact) | 🔄 In progress |
| **Database** | Supabase Postgres (RLS) | Neon Postgres + Drizzle ORM | ✅ Schema + queries + mutations done |
| **File Storage** | Supabase Storage (property-photos, property-documents) | Cloudflare R2 (public URLs + signed downloads) | 📋 Planned |
| **Realtime** | Supabase Realtime (postgres_changes) | Ably (pub/sub for communications, AI actions) | 📋 Planned |
| **Scheduled Jobs** | Supabase Edge Functions (cron) | Vercel Cron + Node route handlers | 📋 Planned |
| **Webhooks** | Supabase-hosted handlers | Vercel route handlers | 📋 Planned |

## Database Schema

**Created at:** `lib/db/schema.ts`  
**ORM:** Drizzle (`lib/db/index.ts`)  
**Queries:** `lib/db/queries/*.ts` (9 files — all entities + dashboard/reports)  
**Mutations:** `lib/db/mutations/*.ts` (12 files — all CRUD + billing/webhooks)  
**Auth helper:** `lib/auth/user.ts` (Drizzle-based, no Supabase dependency)

### Core Tables

- `profiles` — Agent accounts (keyed by Clerk user ID, no Supabase auth)
- `leads`, `properties`, `viewings`, `deals`, `communications` — CRM entities
- `ai_actions` — AI-generated prioritized tasks
- `subscriptions` — Paystack billing status
- `property_photos`, `property_documents` — Metadata only; files live in R2
- `webhook_logs` — WhatsApp & Paystack audit trail

**Data Migration:** Fresh start (no Supabase export)

## Implementation Order

### Phase 1: Auth + Profile Boundaries (✅ Done — except page imports)
1. ✅ Add Clerk SDK to middleware + root layout
2. ✅ Create `requireUser()` + `ensureProfile()` helpers (migrated to Drizzle)
3. 📋 Update login/signup pages (remove Supabase auth, use Clerk forms)
4. 📋 Test profile auto-creation on first sign-in

### Phase 2: Core Query & Mutation Layer (🔧 Built, needs DB + page rewire)
5. ✅ Drizzle schema defined + migration SQL generated (`lib/db/migrations/0000_dear_moonstone.sql`)
6. ✅ Neon + Drizzle ORM packages installed
7. ✅ Drizzle queries created (`lib/db/queries/*.ts` — 9 files)
8. ✅ Drizzle mutations created (`lib/db/mutations/*.ts` — 12 files)
9. ✅ Auth helper switched to Drizzle (`lib/auth/user.ts`)
10. ⏳ **Deploy to Neon database** → `npx drizzle-kit migrate` (needs DATABASE_URL)
11. 📋 Update all page/component imports to new query/mutation locations

### Phase 3: File Storage
12. 📋 Configure Cloudflare R2 bucket + public access
13. 📋 Add R2 client to `lib/storage/r2.ts`
14. 📋 Migrate property photo/document upload logic
15. 📋 Update photo URL + document signing functions

### Phase 4: Realtime & Events
16. 📋 Add Ably to `lib/realtime/ably.ts`
17. 📋 Replace Supabase `.channel().on("postgres_changes")` with Ably subscriptions
18. 📋 Update `components/communications/realtime-thread.tsx`
19. 📋 Update `components/dashboard/live-action-bell.tsx`

### Phase 5: Webhooks
20. 📋 Migrate WhatsApp webhook to Vercel route handler
21. 📋 Migrate Paystack webhook to Vercel route handler
22. 📋 Update webhook verification logic (remove Supabase service role references)

### Phase 6: Scheduled Jobs
23. 📋 Deploy Vercel Cron job for AI action generation
24. 📋 Deploy Vercel Cron job for lead scoring (or event-driven)

### Phase 7: Cleanup
25. 📋 Remove `lib/supabase/*` directory
26. 📋 Remove `@supabase/*` npm packages
27. 📋 Remove `supabase/` directory (Edge Functions)
28. 📋 Update README, docs, env templates

## Environment Variables

### Add
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Neon
DATABASE_URL=postgresql://user:pass@project.neon.tech/arkynex?sslmode=require

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=arkynex
R2_PUBLIC_URL=https://r2.yourdomain.com

# Ably
NEXT_PUBLIC_ABLY_CLIENT_KEY=
ABLY_SERVER_KEY=

# Paystack (unchanged)
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
NEXT_PUBLIC_PAYSTACK_PLAN_STARTER=
NEXT_PUBLIC_PAYSTACK_PLAN_PRO=
NEXT_PUBLIC_PAYSTACK_PLAN_AGENCY=

# WhatsApp (unchanged)
WHATSAPP_APP_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
NEXT_PUBLIC_PLATFORM_WA_NUMBER=
```

### Remove
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Key Behavioral Changes

### Backward Incompatibility
- All user IDs are now Clerk user IDs (string, not UUID)
- No RLS (Row-Level Security) — auth checks move to `requireUser()` function  
- File URLs are R2 URLs, not Supabase Storage URLs
- Realtime updates are Ably, not PostgreSQL changes

### Preserved Features
- Google OAuth sign-in ✅
- Email/password sign-in ✅
- Onboarding flow ✅
- WhatsApp pairing & messaging ✅
- Paystack billing ✅
- Property photos & documents ✅
- Lead scoring (will move to scheduled job) ✅
- AI action generation (will move to scheduled job) ✅
- Reporting & analytics ✅

## Testing Strategy

1. **Schema validation** — Deploy to Neon, verify tables & relationships
2. **Auth flow** — Test Clerk sign-up, sign-in, profile creation
3. **CRUD operations** — Insert/read/update/delete one entity per table
4. **Real-time updates** — Publish & subscribe via Ably
5. **File uploads** — Upload photo/document to R2, verify URLs
6. **Webhooks** — Trigger WhatsApp & Paystack webhook test events
7. **Scheduled jobs** — Run cron jobs manually, check output

## Post-Migration

- Redirect all documentation to new setup guides
- Archive old Supabase docs
- Update CI/CD pipeline (remove Supabase CLI, add Drizzle migrations)
- Plan for future features (no longer tied to Supabase pricing)

## Notes

- **Data loss:** No existing Supabase data is imported (fresh start)
- **User migration:** Existing users must sign up again with Clerk
- **Downtime:** Recommend a maintenance window for cutover
- **Gradual rollout:** Consider A/B testing or parallel running if production has active users