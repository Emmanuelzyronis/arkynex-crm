import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { SettingsTabs } from "@/components/settings/settings-tabs";
import { requireAuthContext } from "@/lib/auth/user";
import { getProfile } from "@/lib/db/queries/profiles";
import { getTeamMembers } from "@/lib/db/queries/team";
import {
  getLastClerkWebhook,
  getLatestSubscription,
} from "@/lib/db/queries/subscriptions";
import { ensureCaptureToken } from "@/lib/db/mutations/profiles";
import { getBillingState } from "@/lib/billing/access";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string; error?: string }>;
}) {
  const { tab, success, error } = await searchParams;
  const context = await requireAuthContext();

  const [personalProfile, workspaceProfile] = await Promise.all([
    context.userId === context.workspaceId ? Promise.resolve(null) : getProfile(context.userId),
    getProfile(context.workspaceId),
  ]);
  const profile = personalProfile ?? workspaceProfile;

  const [billing, members] = await Promise.all([
    getBillingState(workspaceProfile),
    getTeamMembers(context.workspaceId),
  ]);
  const [subscription, lastWebhook] = await Promise.all([
    getLatestSubscription(context.workspaceId),
    getLastClerkWebhook(),
  ]);
  const captureToken = await ensureCaptureToken(context.workspaceId);
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const siteUrl =
    (host ? `${proto}://${host}` : null) ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://arkynex-crm.vercel.app";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage your profile, business details, integrations and billing.
        </p>
      </div>

      {success && (
        <div className="rounded-xl border border-status-closed/30 bg-status-closed/10 px-4 py-3 text-sm text-status-closed">
          {success === "profile" ? "Profile saved successfully." : "Settings saved."}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
          {error === "trial_expired"
            ? "Your free trial has ended. Choose a plan to continue using Arkynex."
            : decodeURIComponent(error)}
        </div>
      )}

      <SettingsTabs
        profile={profile}
        billing={billing}
        captureToken={captureToken}
        siteUrl={siteUrl}
        members={members}
        routingEnabled={profile?.leadRoutingEnabled ?? false}
        subscription={subscription}
        lastWebhook={lastWebhook}
        initialTab={tab}
        userId={context.userId}
      />
    </div>
  );
}
