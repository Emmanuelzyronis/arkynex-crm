"use client";

import { useState } from "react";
import { Bell, Building2, CreditCard, MessageCircle, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ProfileSection, BusinessSection, BillingSection, NotificationsSection } from "@/components/settings/sections";
import { WhatsAppSection } from "@/components/settings/whatsapp-section";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type TabKey = "profile" | "business" | "whatsapp" | "billing" | "notifications";

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "business", label: "Business", icon: Building2 },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export function SettingsTabs({
  profile,
  initialTab,
  pairingCode,
  userId,
}: {
  profile: Tables<"profiles"> | null;
  initialTab?: string;
  pairingCode?: string | null;
  userId?: string;
}) {
  const [active, setActive] = useState<TabKey>((initialTab as TabKey) ?? "profile");

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          const isWhatsApp = key === "whatsapp";
          const showDot = isWhatsApp && !profile?.whatsapp_verified_at;
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
              {showDot && (
                <span className="ml-auto h-2 w-2 rounded-full bg-status-negotiating" title="Not connected" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        {active === "profile" && <ProfileSection profile={profile} />}
        {active === "business" && <BusinessSection />}
        {active === "whatsapp" && (
          <WhatsAppSection profile={profile} pairingCode={pairingCode} userId={userId} />
        )}
        {active === "billing" && <BillingSection profile={profile} />}
        {active === "notifications" && <NotificationsSection />}
      </div>
    </div>
  );
}
