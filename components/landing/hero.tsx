"use client";

import { motion } from "motion/react";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";

const trustItems = [
  "No credit card required",
  "Cancel anytime",
  "Setup in 2 minutes",
];

export function Hero() {
  return (
    <section className="bg-radial-fade relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built for real estate professionals
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Close More Property Deals{" "}
            <span className="text-primary">Without Losing Leads</span>
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-muted">
            Arkynex is the all-in-one CRM that helps you manage leads,
            viewings, properties and deals — powered by AI.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild>
              <a href="/signup">
                Start 14-day free trial
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#demo">
                <PlayCircle className="h-4 w-4" />
                Watch demo
              </a>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            {trustItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
