import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { loginWithEmail, loginWithGoogle } from "@/lib/supabase/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/landing/logo";
import { AuthVisual } from "@/components/auth/auth-visual";
import { GoogleIcon } from "@/components/auth/google-icon";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <Logo />

          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-ink">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Sign in to access your dashboard
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
              {decodeURIComponent(error)}
            </div>
          )}

          <form className="mt-8 space-y-5">
            {next && <input type="hidden" name="next" value={next} />}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary-hover"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" name="remember" />
              <Label htmlFor="remember" className="font-normal text-ink-muted">
                Remember me
              </Label>
            </div>

            <Button type="submit" size="lg" className="w-full" formAction={loginWithEmail}>
              Sign in
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
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:text-primary-hover">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <AuthVisual />
    </div>
  );
}
