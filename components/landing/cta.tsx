import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BuildingIllustration } from "@/components/landing/building-illustration";

const checks = ["14-day free trial", "No credit card required", "Cancel anytime"];

export function Cta() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="grid overflow-hidden rounded-3xl bg-primary/5 lg:grid-cols-2">
        <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Ready to close more deals?
          </h2>
          <p className="mt-3 max-w-md text-lg text-ink-muted">
            Join thousands of real estate professionals growing their business
            with Arkynex.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            {checks.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-status-closed" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start your free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative hidden min-h-[360px] lg:block">
          <BuildingIllustration tone="dusk" className="h-full w-full" />
        </div>
      </div>
    </section>
  );
}
