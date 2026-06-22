# Edge Functions Setup Guide

Two Edge Functions live in `supabase/functions/`:

## 1. score-lead — real-time lead scoring

**Scores a lead 0-100 on:** completeness (25pts), timeline urgency (20pts),
budget size (20pts), source quality (15pts), stage (10pts), recency (10pts).

### Deploy
```bash
npx supabase login
npx supabase link --project-ref ymlnxbsqnfgjhhjsuzql
npx supabase functions deploy score-lead --no-verify-jwt
```

### Wire up (Supabase Dashboard → Database → Webhooks → Create new webhook)
- **Name:** score-lead-on-change
- **Table:** leads (schema: public)
- **Events:** ☑ Insert  ☑ Update
- **Type:** HTTP Request
- **URL:** `https://ymlnxbsqnfgjhhjsuzql.supabase.co/functions/v1/score-lead`
- **HTTP Headers:**
  - `Authorization: Bearer <YOUR_SERVICE_ROLE_KEY>`
  - `Content-Type: application/json`

### Manual trigger (test)
```bash
curl -X POST \
  https://ymlnxbsqnfgjhhjsuzql.supabase.co/functions/v1/score-lead \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"leadId": "<any-lead-uuid>"}'
```

---

## 2. generate-ai-actions — nightly action generation

**Generates AI actions for every active agent based on:**
- Stale leads (not contacted in 5+ days)
- Viewings happening tomorrow (send confirmation reminder)
- Past viewings with no outcome logged
- Deals with low closing probability (≤30%)
- New leads captured today with no contact yet

### Deploy
```bash
npx supabase functions deploy generate-ai-actions --no-verify-jwt
```

### Schedule (run once in Supabase SQL Editor)
```sql
-- Enable pg_cron if not already enabled
create extension if not exists pg_cron;

-- Schedule nightly at 01:00 WAT (00:00 UTC)
select cron.schedule(
  'nightly-ai-actions',
  '0 0 * * *',
  $$
  select net.http_post(
    url := 'https://ymlnxbsqnfgjhhjsuzql.supabase.co/functions/v1/generate-ai-actions',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### Manual trigger (test any time)
```bash
curl -X POST \
  https://ymlnxbsqnfgjhhjsuzql.supabase.co/functions/v1/generate-ai-actions \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Expected response
```json
{
  "success": true,
  "date": "2026-06-17",
  "actionsCreated": 7,
  "agents": 1
}
```

---

## Scoring breakdown example

```json
{
  "leadId": "...",
  "score": 78,
  "breakdown": {
    "completeness": 20,
    "timeline": 16,
    "budget": 18,
    "source": 14,
    "stage": 5,
    "recency": 5
  }
}
```

## Service Role Key

Find it in: **Supabase Dashboard → Project Settings → API → service_role (secret)**

Never expose this key in the browser or commit it to git.
Add it to your hosting environment as `SUPABASE_SERVICE_ROLE_KEY`.
