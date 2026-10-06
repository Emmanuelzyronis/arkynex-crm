import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { planOrder, plans } from "@/lib/mock-settings";

const highlights: Record<string, boolean> = { pro: true };

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-line/60 bg-surface/50">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Simple pricing
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Start free for 15 days
          </h2>
          <p className="mt-4 text-lg text-ink-muted">
            No credit card required. Pick the plan that fits your business —
            change or cancel anytime.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-3">
          {planOrder.map((tier) => {
            const plan = plans[tier];
            const featured = highlights[tier];
            return (
              <div
                key={tier}
                className={`flex flex-col rounded-3xl border bg-card p-6 ${
                  featured ? "border-primary shadow-lg shadow-primary/10" : "border-line"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{plan.name}</p>
                  {featured && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold text-white">
                      Most popular
                    </span>
                  )}
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">
                  {plan.price}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm text-ink-muted">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-status-closed" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={featured ? "default" : "outline"}
                  asChild
                >
                  <Link href="/signup">Start free trial</Link>
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted">
          Prices in USD. Billed monthly. Cancel anytime from your billing settings.
        </p>
      </div>
    </section>
  );
}
