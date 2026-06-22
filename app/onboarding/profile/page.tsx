import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { saveProfileStep } from "@/lib/supabase/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";

const timezoneOptions = [
  "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Cairo", "Europe/London",
];

export default async function ProfileStep({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, agency_name, timezone")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Let&apos;s set up your profile
      </h1>
      <p className="mt-1.5 text-ink-muted">This helps us personalize your experience</p>

      {error && (
        <div className="mt-4 rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
          {decodeURIComponent(error)}
        </div>
      )}

      <form className="mt-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              required
              defaultValue={profile?.full_name ?? ""}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agencyName">Agency name</Label>
            <Input
              id="agencyName"
              name="agencyName"
              defaultValue={profile?.agency_name ?? ""}
              placeholder="Doe Properties Ltd."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <PhoneInput
              id="phone"
              name="phone"
              defaultValue={profile?.phone ?? ""}
              placeholder="801 234 5678"
              autoComplete="tel"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <Select id="timezone" name="timezone" defaultValue={profile?.timezone ?? "Africa/Lagos"}>
              {timezoneOptions.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <Button size="lg" formAction={saveProfileStep}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
