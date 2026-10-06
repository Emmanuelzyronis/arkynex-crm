"use client";

import { useState } from "react";
import { Bell, Building2, CreditCard, Globe, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  ProfileSection,
  BusinessSection,
  BillingSection,
  NotificationsSection,
  LeadCaptureSection,
  TeamSection,
} from "@/components/settings/sections";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/db/schema";
import type { BillingState } from "@/lib/billing/plans";
import type { TeamMemberWithStats } from "@/lib/db/queries/team";
import type { Subscription } from "@/lib/db/schema";
import type { WebhookSummary } from "@/lib/db/queries/subscriptions";

type TabKey = "profile" | "business" | "capture" | "team" | "billing" | "notifications";

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "business", label: "Business", icon: Building2 },
  { key: "capture", label: "Lead capture", icon: Globe },
  { key: "team", label: "Team", icon: Users },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsTabs({
  profile,
  billing,
  captureToken,
  siteUrl,
  members,
  routingEnabled,
  subscription,
  lastWebhook,
  initialTab,
  userId,
}: {
  profile: Profile | null;
  billing?: BillingState | null;
  captureToken?: string;
  siteUrl?: string;
  members?: TeamMemberWithStats[];
  routingEnabled?: boolean;
  subscription?: Subscription | null;
  lastWebhook?: WebhookSummary | null;
  initialTab?: string;
  userId?: string;
}) {
  const [active, setActive] = useState<TabKey>((initialTab as TabKey) ?? "profile");

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={cn(
                "relative flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:w-full",
                isActive ? "bg-primary/10 text-primary" : "text-ink-muted hover:bg-surface hover:text-ink",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        {active === "profile" && <ProfileSection profile={profile} />}
        {active === "business" && <BusinessSection profile={profile} />}
        {active === "capture" && (
          <LeadCaptureSection profile={profile} captureToken={captureToken} siteUrl={siteUrl} />
        )}
        {active === "team" && (
          <TeamSection members={members ?? []} routingEnabled={routingEnabled ?? false} />
        )}
        {active === "billing" && (
          <BillingSection
            profile={profile}
            billing={billing}
            subscription={subscription}
            lastWebhook={lastWebhook}
          />
        )}
        {active === "notifications" && <NotificationsSection profile={profile} />}
      </div>
    </div>
  );
}
