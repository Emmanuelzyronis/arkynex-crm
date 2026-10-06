"use client";

import { motion } from "motion/react";
import { Bell, Search, Sparkles } from "lucide-react";

import { formatMoney, formatMoneyCompact } from "@/lib/currency";
import { avatarPhoto } from "@/lib/images";

const funnelStages = [
  { label: "New", value: 98, width: "100%", color: "bg-primary/15" },
  { label: "Contacted", value: 76, width: "84%", color: "bg-primary/35" },
  { label: "Viewing", value: 42, width: "66%", color: "bg-primary/60" },
  { label: "Negotiating", value: 21, width: "48%", color: "bg-status-negotiating" },
  { label: "Closed", value: 14, width: "32%", color: "bg-status-closed" },
];

const float = (duration: number, delay: number, distance = 8) => ({
  y: [0, -distance, 0],
  transition: { duration, delay, repeat: Infinity, ease: "easeInOut" as const },
});

export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0">
      {/* ambient glow behind the card */}
      <div className="absolute -inset-x-8 -top-8 -z-10 h-64 rounded-[40px] bg-primary/10 blur-3xl" />

      {/* main dashboard card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="rounded-2xl border border-line bg-card p-5 shadow-xl shadow-ink/5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">Good morning, John 👋</p>
            <p className="text-xs text-ink-muted">
              Here&apos;s what&apos;s happening today
            </p>
          </div>
          <div className="flex items-center gap-3 text-ink-muted">
            <Search className="h-4 w-4" />
            <Bell className="h-4 w-4" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarPhoto(1, 64)}
              alt="Account avatar"
              className="h-7 w-7 rounded-full object-cover"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs text-ink-muted">Total Leads</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-ink">248</p>
            <p className="mt-1 text-xs font-medium text-status-closed">
              ↑ 12% vs last month
            </p>
          </div>
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs text-ink-muted">Revenue (This Month)</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
              {formatMoneyCompact(412_000)}
            </p>
            <p className="mt-1 text-xs font-medium text-status-closed">
              ↑ 24% vs last month
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Lead pipeline funnel */}
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-medium text-ink-muted">Lead Pipeline</p>
            <div className="mt-3 space-y-2">
              {funnelStages.map((stage) => (
                <div key={stage.label}>
                  <div className="mb-1 flex items-baseline justify-between text-[10px] text-ink-muted">
                    <span>{stage.label}</span>
                    <span className="font-medium text-ink">{stage.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface">
                    <div
                      className={`h-2 rounded-full ${stage.color}`}
                      style={{ width: stage.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue sparkline */}
          <div className="rounded-xl border border-line p-3">
            <p className="text-xs font-medium text-ink-muted">Revenue Overview</p>
            <p className="mt-1 text-base font-semibold tracking-tight text-ink">
              {formatMoney(412_000)}
            </p>
            <svg viewBox="0 0 200 70" className="mt-3 h-16 w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B5FEF" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#5B5FEF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,52 L29,46 L57,49 L86,32 L114,37 L143,16 L171,20 L200,8 L200,70 L0,70 Z"
                fill="url(#revenueFill)"
              />
              <path
                d="M0,52 L29,46 L57,49 L86,32 L114,37 L143,16 L171,20 L200,8"
                fill="none"
                stroke="#5B5FEF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
              <span>May 1</span>
              <span>May 29</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating: new lead */}
      <motion.div
        initial={{ opacity: 0, x: 24, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
        className="absolute -right-4 -top-7 hidden w-48 rounded-xl border border-line bg-card p-3 shadow-lg shadow-ink/10 sm:block"
      >
        <motion.div animate={float(5, 1.2)}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
            New Lead
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">Marcus Bennett</p>
          <p className="text-xs text-ink-muted">Budget $450K – $650K</p>
        </motion.div>
      </motion.div>

      {/* Floating: AI action */}
      <motion.div
        initial={{ opacity: 0, x: -24, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        className="absolute -bottom-8 -left-6 w-52 rounded-xl bg-primary p-3 text-white shadow-lg shadow-primary/30"
      >
        <motion.div animate={float(6, 1.4)}>
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
            <Sparkles className="h-3 w-3" />
            AI Action
          </div>
          <p className="mt-1 text-sm font-semibold">Follow up with Marcus</p>
          <p className="text-xs text-white/70">High priority · Due today</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
