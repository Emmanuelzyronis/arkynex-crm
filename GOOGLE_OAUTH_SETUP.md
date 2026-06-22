# Google OAuth + Supabase Auth Setup Guide

Run these steps ONCE to enable the full authentication flow.

---

## 1. Supabase Dashboard — Site URL

Go to: Authentication → URL Configuration

Set **Site URL** to:
```
http://localhost:3000
```
(Update to your production domain when you deploy.)

---

## 2. Supabase Dashboard — Redirect URLs

In the same page, add these to **Redirect URLs** (one per line):
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

---

## 3. Google Cloud Console

1. Go to https://console.cloud.google.com
2. Create a project (or use existing)
3. Enable **OAuth 2.0** under APIs & Services → Credentials
4. Create a **Web application** OAuth 2.0 Client ID
5. Add these **Authorized redirect URIs**:
   ```
   https://ymlnxbsqnfgjhhjsuzql.supabase.co/auth/v1/callback
   ```
6. Copy the **Client ID** and **Client Secret**

---

## 4. Supabase Dashboard — Enable Google Provider

Go to: Authentication → Providers → Google

- Toggle **Enable** ON
- Paste your Google **Client ID**
- Paste your Google **Client Secret**
- Save

---

## 5. Supabase Dashboard — Email Confirmations

Go to: Authentication → Providers → Email

Recommended for production:
- **Confirm email**: ON
- **Secure email change**: ON

For local testing only, you can turn these OFF to skip email verification.

---

## 6. Local .env.local

Your `.env.local` already has the correct values:
```
NEXT_PUBLIC_SUPABASE_URL=https://ymlnxbsqnfgjhhjsuzql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Auth Flow Summary

| Action | What happens |
|--------|-------------|
| Sign up with email | Creates user → trigger creates `profiles` row → email verification sent → click link → `/onboarding/profile` |
| Sign in with email | Checks password → session set → `/dashboard` (or `?next=` redirect) |
| Sign in with Google | Redirects to Google → Supabase callback → `/auth/callback` → checks onboarding → `/dashboard` or `/onboarding/...` |
| Sign out | Clears session → `/login` |
| Visit protected route unauthenticated | Middleware redirects to `/login?next=<route>` |
| Visit login/signup while authenticated | Middleware redirects to `/dashboard` |

---

## Testing Checklist

```
✅ npm run dev starts without errors
✅ / (landing page) loads
✅ /signup creates a new user
✅ Email arrives with confirmation link
✅ Clicking link lands on /onboarding/profile
✅ Complete all 4 onboarding steps
✅ /dashboard shows real stats (zeros on a fresh account — that's correct)
✅ /leads/new creates a lead → redirects to /leads/:id
✅ /properties/new creates a property → redirects to /properties/:id
✅ Photo upload works on /properties/:id
✅ /viewings/new creates a viewing
✅ /deals/new creates a deal
✅ Google OAuth: click "Continue with Google" → Google picker → back to /dashboard
✅ Sign out from the avatar menu → redirects to /login
```
