"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";

import { saveGoalsStep } from "@/lib/db/mutations/onboarding";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const goals = [
  { value: "1-5", label: "1 – 5 deals", hint: "Just getting started" },
  { value: "5-10", label: "5 – 10 deals", hint: "Building momentum" },
  { value: "10+", label: "10+ deals", hint: "High-volume agent or team" },
];

const priorities = [
  { value: "follow_up", label: "Follow up faster", hint: "Never let a lead go cold" },
  { value: "conversion", label: "Convert more viewings", hint: "Turn viewings into offers" },
  { value: "organization", label: "Stay organized", hint: "One place for everything" },
];

export default function GoalsStep() {
  const [selected, setSelected] = useState("5-10");
  const [priority, setPriority] = useState("follow_up");

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        What are your goals?
      </h1>
      <p className="mt-1.5 text-ink-muted">How many deals do you aim to close per month?</p>

      <form className="mt-8">
        <input type="hidden" name="dealGoal" value={selected} />
        <input type="hidden" name="priority" value={priority} />

        <div className="space-y-3">
          {goals.map(({ value, label, hint }) => {
            const active = selected === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelected(value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors",
                  active ? "border-primary bg-primary/10" : "border-line hover:border-ink-muted",
                )}
              >
                <span>
                  <span className={cn("block text-sm font-semibold", active ? "text-primary" : "text-ink")}>
                    {label}
                  </span>
                  <span className="block text-xs text-ink-muted">{hint}</span>
                </span>
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", active ? "border-primary" : "border-line")}>
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-sm font-medium text-ink">What matters most right now?</p>
        <div className="mt-3 space-y-3">
          {priorities.map(({ value, label, hint }) => {
            const active = priority === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors",
                  active ? "border-primary bg-primary/10" : "border-line hover:border-ink-muted",
                )}
              >
                <span>
                  <span className={cn("block text-sm font-semibold", active ? "text-primary" : "text-ink")}>
                    {label}
                  </span>
                  <span className="block text-xs text-ink-muted">{hint}</span>
                </span>
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", active ? "border-primary" : "border-line")}>
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-xl bg-status-closed/10 px-4 py-3 text-sm font-medium text-status-closed">
          <PartyPopper className="h-4 w-4" />
          Your CRM is ready — let&apos;s find your first leads.
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/onboarding/business">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button size="lg" formAction={saveGoalsStep}>
            Go to dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
