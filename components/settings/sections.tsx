"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Globe,
  Shuffle,
  Trash2,
  UserPlus,
} from "lucide-react";

import { PricingTable } from "@clerk/nextjs";

import {
  saveBusinessSettings,
  saveNotificationPrefs,
  saveProfile,
} from "@/lib/db/mutations/settings";
import { setLeadCaptureEnabled } from "@/lib/db/mutations/profiles";
import {
  createTeamMember,
  removeTeamMember,
  setLeadRouting,
  updateTeamMember,
} from "@/lib/db/mutations/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { initials } from "@/lib/mock-leads";
import { notificationGroups, planOrder, plans } from "@/lib/mock-settings";
import { TRIAL_DAYS, clerkBillingEnabled, type BillingState } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/db/schema";
import type { TeamMemberWithStats } from "@/lib/db/queries/team";
import type { Subscription } from "@/lib/db/schema";
import type { WebhookSummary } from "@/lib/db/queries/subscriptions";



const timezoneOptions = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
];

const operatingAreas = [
  "Downtown", "Riverside", "Chelsea", "Greenwood", "Harbor Island", "Maplewood", "Midtown", "Northgate",
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

export function ProfileSection({ profile }: { profile: Profile | null }) {
  const name = profile?.fullName ?? "";
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
          <Input id="fullName" name="fullName" defaultValue={profile?.fullName ?? ""} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="" disabled placeholder="Change email in your account settings" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <PhoneInput id="phone" name="phone" defaultValue={profile?.phone?.replace(/^\+1\s?/, "") ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="agencyName">Agency name</Label>
          <Input id="agencyName" name="agencyName" defaultValue={profile?.agencyName ?? ""} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select id="timezone" name="timezone" defaultValue={profile?.timezone ?? "UTC"} className="sm:w-64">
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

type BusinessPrefs = { market?: string; areas?: string[]; propertyTypes?: string[] };

export function BusinessSection({ profile }: { profile: Profile | null }) {
  const prefs = (profile?.businessPrefs as BusinessPrefs | null) ?? {};
  const [selectedAreas, setSelectedAreas] = useState<string[]>(prefs.areas ?? ["Downtown", "Riverside"]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(prefs.propertyTypes ?? ["apartment", "house"]);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div>
      <SectionHeader title="Business" description="Tell Arkynex where you operate and what you sell." />

      <form>
        <div className="mt-6 max-w-xs space-y-1.5">
          <Label htmlFor="primaryMarket">Primary market</Label>
          <Select id="primaryMarket" name="primaryMarket" defaultValue={prefs.market ?? "New York"}>
            <option>New York</option><option>London</option><option>Dubai</option><option>Miami</option><option>Other</option>
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
          {selectedAreas.map((area) => (
            <input key={area} type="hidden" name="areas" value={area} />
          ))}
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
          {selectedTypes.map((type) => (
            <input key={type} type="hidden" name="propertyTypes" value={type} />
          ))}
        </div>

        <div className="mt-6 max-w-md space-y-1.5">
          <Label htmlFor="websiteUrl">Website</Label>
          <Input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://youragency.com" defaultValue={profile?.websiteUrl ?? ""} />
          <p className="text-xs text-ink-muted">Shown on your public lead-capture form.</p>
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" formAction={saveBusinessSettings}>Save changes</Button>
        </div>
      </form>
    </div>
  );
}
export function BillingSection({
  profile,
  billing,
  subscription,
  lastWebhook,
}: {
  profile: Profile | null;
  billing?: BillingState | null;
  subscription?: Subscription | null;
  lastWebhook?: WebhookSummary | null;
}) {
  const billingEnabled = clerkBillingEnabled();

  const trialEndsAt =
    billing?.trialEndsAt ??
    (profile?.trialEndsAt ? new Date(profile.trialEndsAt).toISOString() : null);
  const trialDaysLeft =
    billing?.trialDaysLeft ??
    (trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000,
          ),
        )
      : 0);
  const status =
    billing?.status ??
    ((profile?.subscriptionStatus as BillingState["status"]) ?? "trialing");
  const tier = billing?.tier ?? profile?.tier ?? "starter";

  const isActive = status === "active";
  const isTrialing = status === "trialing" && trialDaysLeft > 0;

  const statusText = isActive
    ? "Active subscription"
    : isTrialing
      ? `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
      : status === "past_due"
        ? "Payment overdue — update your payment method"
        : "Your free trial has ended — choose a plan to continue";

  return (
    <div>
      <SectionHeader title="Billing" description="Manage your subscription and payment details." />

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold capitalize text-ink">{tier} plan</p>
          <p
            className={cn(
              "mt-0.5 text-xs font-medium",
              isActive
                ? "text-status-closed"
                : isTrialing
                  ? "text-status-negotiating"
                  : "text-status-lost",
            )}
          >
            {statusText}
          </p>
        </div>
        {isTrialing && trialEndsAt && (
          <p className="text-xs text-ink-muted">
            Trial ends{" "}
            {new Date(trialEndsAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-line p-4">
        <h3 className="text-sm font-semibold text-ink">Subscription sync</h3>
        <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Synced plan</dt>
            <dd className="mt-0.5 font-medium capitalize text-ink">
              {subscription?.plan ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Synced status</dt>
            <dd className="mt-0.5 font-medium capitalize text-ink">
              {subscription?.status?.replace(/_/g, " ") ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Clerk subscription</dt>
            <dd className="mt-0.5 break-all font-mono text-[11px] text-ink">
              {subscription?.clerkSubscriptionId ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Current period end</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {subscription?.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink-muted">Last Clerk webhook</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {lastWebhook
                ? `${lastWebhook.eventType ?? "event"} · ${new Date(
                    lastWebhook.createdAt,
                  ).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : "No webhook received yet"}
              {lastWebhook?.error && (
                <span className="ml-1 text-status-lost">({lastWebhook.error})</span>
              )}
            </dd>
          </div>
        </dl>
        {!subscription && (
          <p className="mt-3 text-xs text-ink-muted">
            Checkout syncs automatically — this fills in after the first Clerk Billing
            event arrives.
          </p>
        )}
      </div>

      {billingEnabled ? (
        <>
          <div className="mt-6">
            <PricingTable />
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            Payments are processed securely by Clerk Billing (Stripe). You can
            switch or cancel your plan at any time from your account menu.
          </p>
        </>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {planOrder.map((t) => {
              const plan = plans[t];
              const isCurrent = t === tier;
              return (
                <div
                  key={t}
                  className={cn(
                    "flex flex-col rounded-2xl border p-4",
                    isCurrent ? "border-primary bg-primary/5" : "border-line",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{plan.name}</p>
                    {isCurrent && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                    {plan.price}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">{plan.description}</p>
                  <ul className="mt-3 space-y-1.5 text-xs text-ink-muted">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-status-closed" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    disabled
                    type="button"
                  >
                    {isCurrent ? "Current plan" : "Coming soon"}
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            {`Checkout is being finalised. Every new account includes a ${TRIAL_DAYS}-day free trial with full access — no card required.`}
          </p>
        </>
      )}
    </div>
  );
}

export function NotificationsSection({ profile }: { profile: Profile | null }) {
  const saved = (profile?.notificationPrefs as Record<string, boolean> | null) ?? null;
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      notificationGroups.flatMap((g) =>
        g.items.map((item) => [item.id, saved?.[item.id] ?? item.defaultChecked]),
      ),
    ),
  );

  return (
    <div>
      <SectionHeader title="Notifications" description="Choose what Arkynex notifies you about." />
      <form>
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
                    <Switch
                      name={item.id}
                      checked={checked[item.id]}
                      onCheckedChange={(v) => setChecked((prev) => ({ ...prev, [item.id]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <Button type="submit" formAction={saveNotificationPrefs}>Save preferences</Button>
        </div>
      </form>
    </div>
  );
}

export function LeadCaptureSection({
  profile,
  captureToken,
  siteUrl,
}: {
  profile: Profile | null;
  captureToken?: string;
  siteUrl?: string;
}) {
  const [copied, setCopied] = useState<"url" | "embed" | null>(null);
  const enabled = profile?.leadCaptureEnabled ?? true;
  const base = siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "";
  const publicUrl = captureToken ? `${base}/f/${captureToken}` : "";
  const embed = `<iframe src="${publicUrl}" title="Contact form" loading="lazy" style="width:100%;max-width:640px;height:900px;border:0"></iframe>`;
  const downloadHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Contact us</title>
<style>body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;display:flex;justify-content:center;padding:24px}</style>
</head>
<body>
${embed}
</body>
</html>`;
  const downloadHref = `data:text/html;charset=utf-8,${encodeURIComponent(downloadHtml)}`;

  function copy(value: string, key: "url" | "embed") {
    void navigator.clipboard?.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <SectionHeader
        title="Lead capture"
        description="Collect enquiries straight from your own website with a hosted form."
      />

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", enabled ? "bg-status-closed/10 text-status-closed" : "bg-line text-ink-muted")}>
            <Globe className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{enabled ? "Form is live" : "Form is paused"}</p>
            <p className="text-xs text-ink-muted">
              {enabled
                ? "Anyone with the link can submit an enquiry."
                : "Submissions are off — visitors will see a message instead."}
            </p>
          </div>
        </div>
        <form className="flex items-center gap-3">
          <Switch name="enabled" defaultChecked={enabled} aria-label="Toggle lead capture" />
          <Button type="submit" size="sm" variant="outline" formAction={setLeadCaptureEnabled}>
            Update
          </Button>
        </form>
      </div>

      <div className="mt-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Your public form link</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={publicUrl} className="font-mono text-xs" />
            <Button type="button" variant="outline" onClick={() => copy(publicUrl, "url")} className="shrink-0 sm:w-40">
              {copied === "url" ? <CheckCircle2 className="h-4 w-4 text-status-closed" /> : <Copy className="h-4 w-4" />}
              {copied === "url" ? "Copied" : "Copy link"}
            </Button>
          </div>
          <p className="text-xs text-ink-muted">
            Share this link, or add it to your website, social bios and email signature.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Embed on your website</Label>
          <pre className="overflow-x-auto rounded-xl border border-line bg-surface p-3 text-xs text-ink-muted">
            <code>{embed}</code>
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => copy(embed, "embed")}>
              {copied === "embed" ? <CheckCircle2 className="h-4 w-4 text-status-closed" /> : <Copy className="h-4 w-4" />}
              {copied === "embed" ? "Copied" : "Copy embed code"}
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={downloadHref} download="arkynex-lead-form.html">
                <Download className="h-4 w-4" />
                Download HTML
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeamSection({
  members,
  routingEnabled,
}: {
  members: TeamMemberWithStats[];
  routingEnabled: boolean;
}) {
  return (
    <div>
      <SectionHeader
        title="Team"
        description="Add the agents who work your pipeline and route new enquiries automatically."
      />

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shuffle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Round-robin lead routing</p>
            <p className="text-xs text-ink-muted">
              New website enquiries go to the active member with the fewest open leads.
            </p>
          </div>
        </div>
        <form className="flex items-center gap-3">
          <Switch name="enabled" defaultChecked={routingEnabled} aria-label="Toggle lead routing" />
          <Button type="submit" size="sm" variant="outline" formAction={setLeadRouting}>
            Update
          </Button>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line">
        {members.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-muted">
            No team members yet — add your first agent below.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {members.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                {member.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatarUrl}
                    alt={member.fullName}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(member.fullName)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{member.fullName}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {member.email} · {member.openLeads} open lead
                    {member.openLeads === 1 ? "" : "s"}
                  </p>
                </div>
                <form className="flex items-center gap-2">
                  <input type="hidden" name="id" value={member.id} />
                  <Select name="role" defaultValue={member.role} className="h-9 w-28">
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </Select>
                  <Select name="status" defaultValue={member.status} className="h-9 w-28">
                    <option value="active">Active</option>
                    <option value="invited">Invited</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                  <Button type="submit" size="sm" variant="outline" formAction={updateTeamMember}>
                    Save
                  </Button>
                </form>
                <form action={removeTeamMember}>
                  <input type="hidden" name="id" value={member.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="text-status-lost hover:bg-status-lost/5 hover:text-status-lost"
                    aria-label={`Remove ${member.fullName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-line p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <UserPlus className="h-4 w-4 text-primary" />
          Add a team member
        </h3>
        <form className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="member-name">Full name</Label>
            <Input id="member-name" name="fullName" required placeholder="Alex Morgan" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-email">Email</Label>
            <Input id="member-email" name="email" type="email" required placeholder="alex@youragency.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-role">Role</Label>
            <Select id="member-role" name="role" defaultValue="agent">
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-status">Status</Label>
            <Select id="member-status" name="status" defaultValue="active">
              <option value="active">Active</option>
              <option value="invited">Invited</option>
            </Select>
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" formAction={createTeamMember}>
              Add member
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
