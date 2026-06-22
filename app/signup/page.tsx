import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { signupWithEmail, loginWithGoogle } from "@/lib/supabase/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/landing/logo";
import { AuthVisual } from "@/components/auth/auth-visual";
import { GoogleIcon } from "@/components/auth/google-icon";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <Logo />

          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-ink">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Start your 14-day free trial — no card required.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
              {decodeURIComponent(error)}
            </div>
          )}

          <form className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                required
                placeholder="John Doe"
              />
            </div>

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

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>

            <Button type="submit" size="lg" className="w-full" formAction={signupWithEmail}>
              Create account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink-muted">or continue with</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form>
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full"
              formAction={loginWithGoogle}
            >
              <GoogleIcon className="h-4 w-4" />
              Continue with Google
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-ink-muted">
            By creating an account, you agree to our Terms of Service and
            Privacy Policy.
          </p>
        </div>
      </div>

      <AuthVisual />
    </div>
  );
}
