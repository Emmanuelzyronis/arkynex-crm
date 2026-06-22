import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/landing/logo";

async function requestPasswordReset(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });

  if (error) redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Logo className="justify-center" />

        <div className="mt-8 rounded-2xl border border-line bg-card p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Forgot your password?
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Enter your email and we&apos;ll send a reset link.
          </p>

          {sent && (
            <div className="mt-4 rounded-xl border border-status-closed/30 bg-status-closed/10 px-4 py-3 text-sm text-status-closed">
              Reset link sent — check your inbox.
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
              {decodeURIComponent(error)}
            </div>
          )}

          <form className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="agent@example.com"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" formAction={requestPasswordReset}>
              Send reset link
            </Button>
          </form>
        </div>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}
