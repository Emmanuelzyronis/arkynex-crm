import Link from "next/link";
import { Mail } from "lucide-react";

import { Logo } from "@/components/landing/logo";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <Logo className="justify-center" />

        <div className="mt-8 rounded-2xl border border-line bg-card p-8">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            We sent a confirmation link to your email address. Click it to
            activate your account and start onboarding.
          </p>

          <div className="mt-6 rounded-xl bg-surface px-4 py-3 text-xs text-ink-muted">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <Link href="/signup" className="font-medium text-primary hover:text-primary-hover">
              try a different email
            </Link>
            .
          </div>
        </div>

        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-ink-muted hover:text-ink"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
