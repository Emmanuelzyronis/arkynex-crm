import { notFound } from "next/navigation";
import { Building2, CheckCircle2 } from "lucide-react";

import { getProfileByCaptureToken } from "@/lib/db/queries/profiles";
import { CaptureForm } from "@/components/leads/capture-form";

export const dynamic = "force-dynamic";

export default async function PublicCapturePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const profile = await getProfileByCaptureToken(token);

  if (!profile) notFound();

  const agentName = profile.agencyName || profile.fullName || "our team";

  return (
    <main className="min-h-screen bg-surface px-6 py-12">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-2 text-primary">
          <Building2 className="h-5 w-5" />
          <span className="text-sm font-semibold">{agentName}</span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink">
          Tell us what you&apos;re looking for
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Share a few details and we&apos;ll send you matching properties — usually
          within a few minutes.
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-card p-6 sm:p-8">
          {profile.leadCaptureEnabled ? (
            <CaptureForm token={token} />
          ) : (
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <CheckCircle2 className="h-4 w-4 text-status-closed" />
              This form is currently closed. Please contact {agentName} directly.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
