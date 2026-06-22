import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/landing/logo";

async function updatePassword(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password !== confirm) {
    redirect("/auth/reset-password?error=Passwords+do+not+match");
  }
  if (password.length < 8) {
    redirect("/auth/reset-password?error=Password+must+be+at+least+8+characters");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`);

  redirect("/dashboard");
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Logo className="justify-center" />

        <div className="mt-8 rounded-2xl border border-line bg-card p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Set a new password
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Choose a strong password for your account.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
              {decodeURIComponent(error)}
            </div>
          )}

          <form className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} placeholder="Repeat your password" />
            </div>
            <Button type="submit" size="lg" className="w-full" formAction={updatePassword}>
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
