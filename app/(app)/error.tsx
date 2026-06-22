"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error monitoring service (Sentry, LogRocket, etc.)
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-status-lost/10 text-status-lost">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <h1 className="mt-5 text-xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        {error.message?.includes("JWT")
          ? "Your session has expired. Please sign in again."
          : error.message ?? "An unexpected error occurred. Please try again."}
      </p>

      {error.digest && (
        <p className="mt-2 font-mono text-xs text-ink-muted/60">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
