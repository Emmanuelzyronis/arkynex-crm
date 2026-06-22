"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { saveProfile } from "@/lib/supabase/mutations/settings";
import { initializePaystackPayment } from "@/lib/supabase/mutations/billing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { initials } from "@/lib/mock-leads";
import { notificationGroups, planOrder, plans } from "@/lib/mock-settings";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type Profile = Tables<"profiles"> | null;
import type { Tables } from "@/lib/supabase/types";


const timezoneOptions = [
  "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Cairo", "Europe/London",
];

const operatingAreas = [
  "Victoria Island", "Lekki Phase 1", "Ikoyi", "Ajah", "Banana Island", "Surulere", "Yaba", "Ikeja",
];

const propertyTypeOptions = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "office", label: "Office" },
];

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
    </div>
  );
}

export function ProfileSection({ profile }: { profile: Profile }) {
  const name = profile?.full_name ?? "";
  return (
    <div>
      <SectionHeader title="Profile" description="Update your personal and agency details." />

      <div className="mt-6 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
          {name ? initials(name) : "?"}
        </div>
        <div>
          <Button variant="outline" size="sm" type="button">Change photo</Button>
          <p className="mt-1.5 text-xs text-ink-muted">JPG or PNG, up to 2MB.</p>
        </div>
      </div>

      <form className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" defaultValue={profile?.full_name ?? ""} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="" disabled placeholder="Change email in Supabase Auth" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <PhoneInput id="phone" name="phone" defaultValue={profile?.phone?.replace(/^\+234/, "") ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agencyName">Agency name</Label>
          <Input id="agencyName" name="agencyName" defaultValue={profile?.agency_name ?? ""} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select id="timezone" name="timezone" defaultValue={profile?.timezone ?? "Africa/Lagos"} className="sm:w-64">
            {timezoneOptions.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
          </Select>
        </div>
        <div className="mt-3 flex justify-end sm:col-span-2">
          <Button formAction={saveProfile}>Save changes</Button>
        </div>
      </form>
    </div>
  );
}

export function BusinessSection() {
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Victoria Island", "Lekki Phase 1"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["apartment", "house"]);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div>
      <SectionHeader title="Business" description="Tell Arkynex where you operate and what you sell." />

      <div className="mt-6 max-w-xs space-y-1.5">
        <Label htmlFor="primaryMarket">Primary market</Label>
        <Select id="primaryMarket" defaultValue="Lagos">
          <option>Lagos</option><option>Abuja</option><option>Port Harcourt</option><option>Ibadan</option><option>Other</option>
        </Select>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-ink">Areas you operate in</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {operatingAreas.map((area) => {
            const active = selectedAreas.includes(area);
            return (
              <button key={area} type="button" onClick={() => setSelectedAreas((prev) => toggle(prev, area))}
                className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors", active ? "border-primary bg-primary/10 text-primary" : "border-line text-ink-muted hover:border-ink-muted")}>
                {area}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-ink">Property types</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {propertyTypeOptions.map(({ value, label }) => {
            const active = selectedTypes.includes(value);
            return (
              <button key={value} type="button" onClick={() => setSelectedTypes((prev) => toggle(prev, value))}
                className={cn("flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors", active ? "border-primary bg-primary/10 text-primary" : "border-line text-ink-muted hover:border-ink-muted")}>
                <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border", active ? "border-primary bg-primary text-white" : "border-line")}>
                  {active && <Check className="h-3 w-3" />}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button type="button">Save changes</Button>
      </div>
    </div>
  );
}
export function BillingSection({ profile }: { profile: Profile }) {
  return (
    <div>
      <SectionHeader title="Billing" description="Manage your subscription and payment details." />

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink capitalize">
            {profile?.tier ?? "starter"} plan
          </p>
          <p className={`mt-0.5 text-xs font-medium ${
            profile?.subscription_status === "trialing"
              ? "text-status-negotiating"
              : profile?.subscription_status === "active"
              ? "text-status-closed"
              : profile?.subscription_status === "past_due"
              ? "text-status-lost"
              : "text-ink-muted"
          }`}>
            {profile?.subscription_status === "trialing"
              ? `Trial ends ${profile?.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" }) : "soon"}`
              : profile?.subscription_status === "active"
              ? "Active subscription"
              : profile?.subscription_status === "past_due"
              ? "Payment overdue — update payment method"
              : profile?.subscription_status ?? "No active subscription"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {planOrder.map((tier) => {
          const plan = plans[tier];
          const isCurrent = tier === (profile?.tier ?? "starter");
          // These plan codes must match your Paystack dashboard plan codes
          const planCodeEnvMap: Record<string, string> = {
            starter: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_STARTER ?? "",
            pro: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_PRO ?? "",
            agency: process.env.NEXT_PUBLIC_PAYSTACK_PLAN_AGENCY ?? "",
          };
          const planCode = planCodeEnvMap[tier];

          return (
            <div key={tier} className={cn("flex flex-col rounded-2xl border p-4", isCurrent ? "border-primary bg-primary/5" : "border-line")}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{plan.name}</p>
                {isCurrent && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">Current</span>}
              </div>
              <p className="mt-1 text-lg font-semibold tracking-tight text-ink">{plan.price}</p>
              <p className="mt-1 text-xs text-ink-muted">{plan.description}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-ink-muted">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-1.5"><Check className="mt-0.5 h-3 w-3 shrink-0 text-status-closed" />{feature}</li>
                ))}
              </ul>
              {!isCurrent && planCode ? (
                <form className="mt-4">
                  <input type="hidden" name="planCode" value={planCode} />
                  <Button size="sm" className="w-full" formAction={initializePaystackPayment}>
                    Subscribe — {plan.price}
                  </Button>
                </form>
              ) : (
                <Button size="sm" variant="outline" className="mt-4" disabled type="button">
                  {isCurrent ? "Current plan" : "Coming soon"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-ink-muted">
        Payments processed securely by{" "}
        <a href="https://paystack.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Paystack
        </a>
        . Cancel anytime from your subscription dashboard.
      </p>
    </div>
  );
}


export function NotificationsSection() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(notificationGroups.flatMap((g) => g.items.map((item) => [item.id, item.defaultChecked]))),
  );

  return (
    <div>
      <SectionHeader title="Notifications" description="Choose what Arkynex notifies you about." />
      <div className="mt-6 space-y-8">
        {notificationGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-ink">{group.title}</h3>
            <div className="mt-3 space-y-4">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{item.description}</p>
                  </div>
                  <Switch checked={checked[item.id]} onCheckedChange={(v) => setChecked((prev) => ({ ...prev, [item.id]: v }))} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
