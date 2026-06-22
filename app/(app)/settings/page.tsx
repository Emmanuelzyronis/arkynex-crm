import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; success?: string; error?: string; code?: string }>;
}) {
  const { tab, success, error, code } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Decode pairing code from URL if freshly generated
  const pairingCode = code ? decodeURIComponent(code) : null;

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
          {decodeURIComponent(error)}
        </div>
      )}

      <SettingsTabs profile={profile} initialTab={tab} pairingCode={pairingCode} userId={user.id} />
    </div>
  );
}
