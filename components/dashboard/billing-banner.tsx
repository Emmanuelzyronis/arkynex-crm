import Link from "next/link";
import { Sparkles } from "lucide-react";

export function BillingBanner({
  status,
  trialDaysLeft,
}: {
  status: string;
  trialDaysLeft: number;
}) {
  if (status === "active") return null;

  const isTrialing = status === "trialing" && trialDaysLeft > 0;

  if (!isTrialing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-status-lost/30 bg-status-lost/10 px-6 py-2.5 text-sm text-status-lost lg:px-8">
        <span className="font-medium">
          Your free trial has ended. Choose a plan to keep using Arkynex.
        </span>
        <Link
          href="/settings?tab=billing"
          className="rounded-lg bg-status-lost px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
        >
          Choose a plan
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary/5 px-6 py-2.5 text-sm text-ink lg:px-8">
      <span className="flex items-center gap-2 font-medium">
        <Sparkles className="h-4 w-4 text-primary" />
        Free trial — {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
      </span>
      <Link
        href="/settings?tab=billing"
        className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-hover"
      >
        Upgrade
      </Link>
    </div>
  );
}
