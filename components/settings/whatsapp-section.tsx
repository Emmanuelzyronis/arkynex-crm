"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, MessageCircle, RefreshCw, Timer } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { generatePairingCode, disconnectWhatsApp } from "@/lib/supabase/mutations/whatsapp";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/lib/supabase/types";

// Platform WhatsApp number — the one agents send their code to.
// Set this to your Arkynex Meta Cloud API number.
const PLATFORM_WA_NUMBER = process.env.NEXT_PUBLIC_PLATFORM_WA_NUMBER ?? "2348000000000";

/** Countdown + auto-poll component — checks verification status every 3s. */
function CodeCountdown({ expiresAt, userId }: { expiresAt: string; userId: string }) {
  const [remaining, setRemaining] = useState(() => {
    const ms = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
  });

  useEffect(() => {
    if (remaining === 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  // Poll for verification — reload the page once connected
  useEffect(() => {
    if (remaining === 0) return;

    const supabase = createClient();
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("whatsapp_verified_at")
        .eq("id", userId)
        .single();

      if (data?.whatsapp_verified_at) {
        clearInterval(poll);
        window.location.reload();
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [userId, remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const expired = remaining === 0;

  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${expired ? "text-status-lost" : "text-status-negotiating"}`}>
      <Timer className="h-3.5 w-3.5" />
      {expired ? "Code expired — generate a new one" : `Expires in ${minutes}:${String(seconds).padStart(2, "0")} — checking automatically`}
    </span>
  );
}

export function WhatsAppSection({
  profile,
  pairingCode,
  userId,
}: {
  profile: Tables<"profiles"> | null;
  pairingCode?: string | null;
  userId?: string;
}) {
  const isVerified = !!profile?.whatsapp_verified_at;
  const hasPendingCode = !!pairingCode && !isVerified;

  // Build the wa.me deep link — one tap opens WhatsApp with the code pre-filled
  const deepLink = hasPendingCode
    ? `https://wa.me/${PLATFORM_WA_NUMBER}?text=${encodeURIComponent(pairingCode)}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">WhatsApp</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Connect your WhatsApp number so Arkynex can capture and log lead conversations automatically.
        </p>
      </div>

      {/* ── Connected state ── */}
      {isVerified && (
        <div className="rounded-2xl border border-status-closed/30 bg-status-closed/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-status-closed/10 text-status-closed">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {profile?.whatsapp_phone ?? "Connected"}
                </p>
                <p className="text-xs text-status-closed">
                  Connected {profile?.whatsapp_verified_at
                    ? new Date(profile.whatsapp_verified_at).toLocaleDateString("en-NG", {
                        month: "short", day: "numeric", year: "numeric",
                      })
                    : ""}
                </p>
              </div>
            </div>
            <form>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                formAction={disconnectWhatsApp}
                className="text-status-lost hover:border-status-lost/30 hover:bg-status-lost/5"
              >
                Disconnect
              </Button>
            </form>
          </div>

          <div className="mt-4 grid gap-2 rounded-xl bg-status-closed/5 px-4 py-3 text-sm text-ink-muted">
            <p>✅ Inbound messages matched to existing leads automatically</p>
            <p>✅ New conversations logged to the lead timeline</p>
            <p>✅ Lead scores updated on each new message</p>
          </div>
        </div>
      )}

      {/* ── Pending code state ── */}
      {hasPendingCode && !isVerified && (
        <div className="rounded-2xl border border-status-negotiating/30 bg-status-negotiating/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-status-negotiating" />
            <p className="text-sm font-semibold text-ink">Waiting for confirmation…</p>
          </div>

          <div>
            <p className="text-xs text-ink-muted mb-2">Your pairing code</p>
            <div className="flex items-center gap-3">
              <span className="inline-block rounded-xl bg-ink px-5 py-3 font-mono text-2xl font-bold tracking-[0.2em] text-white">
                {pairingCode}
              </span>
            </div>
          </div>

          {profile?.whatsapp_pairing_expires && (
            <CodeCountdown expiresAt={profile.whatsapp_pairing_expires} userId={userId ?? profile.id} />
          )}

          <div className="rounded-xl border border-line bg-card p-4 space-y-3">
            <p className="text-sm font-medium text-ink">How to connect:</p>
            <ol className="space-y-2 text-sm text-ink-muted">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                Tap the button below to open WhatsApp with the code pre-filled
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                Send the message to the Arkynex platform number
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                Come back here — the page will show ✅ Connected
              </li>
            </ol>

            <a
              href={deepLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Open WhatsApp to send code
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>

            <p className="text-center text-xs text-ink-muted">
              Or manually send <span className="font-mono font-bold">{pairingCode}</span> to{" "}
              <a
                href={`https://wa.me/${PLATFORM_WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary"
              >
                wa.me/{PLATFORM_WA_NUMBER}
              </a>
            </p>
          </div>

          <p className="text-xs text-ink-muted">
            Already sent it?{" "}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-medium text-primary hover:text-primary-hover"
            >
              Refresh this page
            </button>{" "}
            to check the connection status.
          </p>
        </div>
      )}

      {/* ── Setup form (not connected, no pending code) ── */}
      {!isVerified && !hasPendingCode && (
        <form className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="whatsappPhone">Your WhatsApp Business number</Label>
            <PhoneInput
              id="whatsappPhone"
              name="whatsappPhone"
              defaultValue={profile?.whatsapp_phone?.replace(/^\+234/, "") ?? ""}
              placeholder="801 234 5678"
              autoComplete="tel"
            />
            <p className="text-xs text-ink-muted">
              This is the number your leads message you on.
            </p>
          </div>

          <Button formAction={generatePairingCode} size="lg">
            <MessageCircle className="h-4 w-4" />
            Generate pairing code
          </Button>
        </form>
      )}

      {/* ── How it works explainer ── */}
      {!isVerified && (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm font-semibold text-ink">How it works</p>
          <div className="mt-3 space-y-3 text-sm text-ink-muted">
            <p>
              <span className="font-medium text-ink">One platform number, multiple agents.</span>{" "}
              Arkynex operates a shared WhatsApp Business number. When your leads message it, Arkynex
              matches their phone to your pipeline and logs the conversation automatically.
            </p>
            <p>
              <span className="font-medium text-ink">No Meta developer account needed.</span>{" "}
              You just send one message to confirm your number. That's it.
            </p>
            <p>
              <span className="font-medium text-ink">WhatsApp Business in-app agent ready.</span>{" "}
              As WhatsApp rolls out its native agent integrations, Arkynex will plug in automatically —
              your number pairing transfers with zero re-setup.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
