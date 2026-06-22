"use client";

import { motion } from "motion/react";
import {
  Bath,
  BarChart3,
  BedDouble,
  Home,
  MessageCircle,
  Ruler,
  Sparkles,
  Users,
} from "lucide-react";

import { BuildingIllustration } from "@/components/landing/building-illustration";

const stageStyles: Record<string, string> = {
  New: "bg-status-new/10 text-status-new",
  Contacted: "bg-status-contacted/10 text-status-contacted",
  Viewing: "bg-status-viewing/10 text-status-viewing",
  Negotiating: "bg-status-negotiating/10 text-status-negotiating",
};

const leads = [
  { name: "Tunde Adebayo", location: "Victoria Island, Lagos", stage: "New", score: 98 },
  { name: "Bolanle Adeyemi", location: "Lekki Phase 1, Lagos", stage: "Contacted", score: 85 },
  { name: "Ibrahim Mohammed", location: "Ikoyi, Lagos", stage: "Viewing", score: 72 },
  { name: "Funke Okoro", location: "Ajah, Lagos", stage: "Negotiating", score: 60 },
];

function LeadsPreview() {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <p className="text-xs font-medium text-ink-muted">All Leads (248)</p>
      <div className="mt-2 space-y-1.5">
        {leads.map((lead) => (
          <div key={lead.name} className="flex items-center gap-2.5 rounded-lg bg-card p-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">{lead.name}</p>
              <p className="truncate text-[10px] text-ink-muted">{lead.location}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stageStyles[lead.stage]}`}
            >
              {lead.stage}
            </span>
            <span className="shrink-0 text-xs font-semibold text-ink">{lead.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PropertyPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="relative aspect-[16/10] overflow-hidden">
        <BuildingIllustration className="h-full w-full" />
        <span className="absolute left-2 top-2 rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-ink shadow-sm">
          For Sale
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-ink">4 Bedroom Duplex</p>
        <p className="text-xs text-ink-muted">Lekki Phase 1, Lagos</p>
        <p className="mt-1.5 text-sm font-semibold text-ink">₦250,000,000</p>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-muted">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" /> 4 Beds
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" /> 5 Baths
          </span>
          <span className="flex items-center gap-1">
            <Ruler className="h-3 w-3" /> 300 sqm
          </span>
        </div>
      </div>
    </div>
  );
}

function WhatsAppPreview() {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/10" />
        <div>
          <p className="text-xs font-medium text-ink">Tunde Adebayo</p>
          <p className="text-[10px] text-status-closed">online</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-card px-3 py-2 text-xs text-ink">
          I&apos;m interested in a 3 bedroom apartment in Victoria Island
        </div>
        <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-primary px-3 py-2 text-xs text-white">
          Great! I have some amazing options for you.
        </div>
        <div className="flex items-start gap-1.5 rounded-xl bg-primary/5 px-3 py-2 text-[10px] text-ink-muted">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
          <span>AI summary: Tunde wants a 3 bedroom apartment in Victoria Island.</span>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPreview() {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-ink-muted">Revenue Overview</p>
        <span className="text-[10px] text-ink-muted">This Month</span>
      </div>
      <p className="mt-1 text-lg font-semibold tracking-tight text-ink">₦12,400,000</p>
      <p className="text-[10px] font-medium text-status-closed">↑ 24% vs last month</p>
      <svg viewBox="0 0 200 70" className="mt-2 h-16 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B5FEF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#5B5FEF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,52 L29,46 L57,49 L86,32 L114,37 L143,16 L171,20 L200,8 L200,70 L0,70 Z"
          fill="url(#analyticsFill)"
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
    </div>
  );
}

const features = [
  {
    icon: Users,
    title: "Smart Lead Management",
    description:
      "Capture leads from WhatsApp, web, referrals and more. Automatically score and track every opportunity.",
    preview: <LeadsPreview />,
  },
  {
    icon: Home,
    title: "Property Management",
    description:
      "List and manage your properties with photos, documents, amenities and viewing analytics.",
    preview: <PropertyPreview />,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Integration",
    description:
      "All conversations in one place. AI summarizes chats and suggests the next best action.",
    preview: <WhatsAppPreview />,
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description:
      "Get real-time insights into your pipeline, revenue, team performance and lead sources.",
    preview: <AnalyticsPreview />,
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Everything you need to grow
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Powerful features built for real estate agents
        </h2>
        <p className="mt-4 text-lg text-ink-muted">
          From capturing leads to closing deals, Arkynex gives you everything
          you need to run your real estate business.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, description, preview }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            className="flex flex-col rounded-2xl border border-line bg-card p-5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{description}</p>
            <div className="mt-5">{preview}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
