"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";

import { LogoMark } from "@/components/landing/logo";
import { cn } from "@/lib/utils";

export const onboardingSteps = [
  { slug: "profile", title: "Profile", description: "Tell us about yourself" },
  { slug: "business", title: "Business", description: "Set up your business" },
  { slug: "whatsapp", title: "WhatsApp", description: "Connect your channel" },
  { slug: "goals", title: "Goals", description: "Tell us your goals" },
];

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    onboardingSteps.findIndex((step) => pathname.includes(step.slug)),
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line/70 bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <LogoMark className="h-7 w-7" />

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ink-muted">
              Step {activeIndex + 1} of {onboardingSteps.length}
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${((activeIndex + 1) / onboardingSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[260px_1fr] lg:gap-12 lg:py-16">
        <nav className="space-y-1">
          {onboardingSteps.map((step, index) => {
            const isActive = index === activeIndex;
            const isComplete = index < activeIndex;

            return (
              <Link
                key={step.slug}
                href={`/onboarding/${step.slug}`}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  isActive ? "bg-primary/10" : "hover:bg-card",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isActive
                      ? "bg-primary text-white"
                      : isComplete
                        ? "bg-status-closed text-white"
                        : "border border-line text-ink-muted",
                  )}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span>
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      isActive ? "text-primary" : "text-ink",
                    )}
                  >
                    {step.title}
                  </span>
                  <span className="block text-xs text-ink-muted">{step.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-line bg-card p-8 sm:p-10">{children}</div>
      </div>
    </div>
  );
}
