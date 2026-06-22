# WhatsApp Integration Setup

Arkynex uses a **shared platform number** approach — you operate ONE Meta Cloud API
WhatsApp Business number. Agents connect by sending a one-time pairing code from
their personal WhatsApp. No agent ever needs their own Meta developer account.

---

## How the pairing flow works

```
Agent enters their number in Settings → WhatsApp
         ↓
System generates code:  ARK-X7K2M  (expires in 30 min)
         ↓
Agent taps "Open WhatsApp" → message pre-filled → one tap to send
         ↓
Webhook receives "ARK-X7K2M" from agent's phone
         ↓
System marks agent as verified → ✅ Connected
         ↓
From now on: leads who message the Arkynex number are matched
to agents by phone number and logged automatically
```

---

## Part 1 — Meta Cloud API setup (one time, done by Arkynex admins)

### 1. Create a Meta App

1. Go to https://developers.facebook.com
2. Create a Business App
3. Add **WhatsApp** as a product
4. Under WhatsApp → API Setup, get your:
   - **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - **Temporary access token** → generate a permanent one via System User

### 2. Get a permanent access token

1. Go to Business Settings → System Users
2. Create a system user with `whatsapp_business_messaging` permission
3. Generate a **never-expiring** token → `WHATSAPP_ACCESS_TOKEN`

### 3. Register your webhook

In Meta Developer Console → WhatsApp → Configuration:

- **Callback URL:** `https://yourdomain.com/api/webhooks/whatsapp`
- **Verify Token:** the value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env`
- **Subscribed fields:** `messages`

### 4. Set env vars

```env
WHATSAPP_APP_SECRET=<from Meta App → Settings → Basic → App Secret>
WHATSAPP_PHONE_NUMBER_ID=<from WhatsApp → API Setup>
WHATSAPP_ACCESS_TOKEN=<system user token>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=arkynex-webhook-secret-change-me
NEXT_PUBLIC_PLATFORM_WA_NUMBER=2348XXXXXXXXX   ← your registered WA number in E.164 (no +)
SUPABASE_SERVICE_ROLE_KEY=<from Supabase → Settings → API>
```

---

## Part 2 — Agent pairing (repeated for every agent)

Agents do this themselves from **Settings → WhatsApp**:

1. Enter their phone number → tap **Generate pairing code**
2. Code appears: `ARK-X7K2M` (valid for 30 minutes)
3. Tap **Open WhatsApp** → message pre-filled → hit Send
4. Refresh the page → see ✅ Connected

That's it. No API keys, no developer console.

---

## What happens after pairing

| Event | What Arkynex does |
|-------|------------------|
| Lead messages the Arkynex number | Matches phone → logs to the right agent's `communications` |
| New phone (no existing lead) | Logs to `webhook_logs` with `event_type = unmatched_lead` for manual review |
| Agent sends a message via Arkynex UI | Logs outbound in `communications`, sends via Meta API |
| Lead score changes on new message | Triggers `score-lead` Edge Function automatically |

---

## WhatsApp Business in-app agent (future)

WhatsApp is rolling out native in-app agent integrations in 2025–2026. When this
API goes GA, Arkynex will support it — agents will be able to connect directly from
within the WhatsApp Business app. The pairing code system stays the same; only the
delivery mechanism changes from "send to our number" to "tap in the WA app".

No re-setup will be needed for existing connected agents.

---

## Testing locally

Meta webhooks need a public HTTPS URL. Use:

```bash
npx localtunnel --port 3000 --subdomain arkynex-dev
```

Set the callback URL in Meta to `https://arkynex-dev.loca.lt/api/webhooks/whatsapp`.

Or use [ngrok](https://ngrok.com):
```bash
ngrok http 3000
```

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| Webhook verification fails | `WHATSAPP_WEBHOOK_VERIFY_TOKEN` must match what you entered in Meta Console |
| Signature verification fails | `WHATSAPP_APP_SECRET` must be the App Secret, not the Access Token |
| Agent's code not found | Code may have expired (30 min limit). Generate a new one. |
| Messages not routing to agent | Agent's phone in `profiles.whatsapp_phone` may not match E.164 format |
| `unmatched_lead` in webhook_logs | A new lead messaged from an unknown number — add them manually in `/leads` |
