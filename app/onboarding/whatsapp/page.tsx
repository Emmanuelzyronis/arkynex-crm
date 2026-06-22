import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { generatePairingCode } from "@/lib/supabase/mutations/whatsapp";
import { saveWhatsAppStep } from "@/lib/supabase/actions/onboarding";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { WhatsAppSection } from "@/components/settings/whatsapp-section";

export default async function WhatsAppStep({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const { code, error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("whatsapp_phone, whatsapp_verified_at, whatsapp_pairing_code, whatsapp_pairing_expires")
    .eq("id", user.id)
    .single();

  const pairingCode = code ? decodeURIComponent(code) : null;
  const isVerified = !!profile?.whatsapp_verified_at;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Connect WhatsApp
      </h1>
      <p className="mt-1.5 text-ink-muted">
        Arkynex captures leads from your WhatsApp conversations automatically — no Meta developer account needed.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
          {decodeURIComponent(error)}
        </div>
      )}

      <div className="mt-6">
        <WhatsAppSection profile={profile as never} pairingCode={pairingCode} />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/onboarding/business">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex gap-3">
          {!isVerified && (
            <form>
              <Button type="submit" variant="outline" formAction={saveWhatsAppStep}>
                Skip for now
              </Button>
            </form>
          )}
          {isVerified && (
            <form>
              <Button type="submit" size="lg" formAction={saveWhatsAppStep}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
