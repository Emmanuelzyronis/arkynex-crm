import type { Metadata } from "next";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Arkynex",
  description: "How Arkynex collects, uses and protects your data.",
};

export default function PrivacyPage() {
  return (
    <MarketingPage
      title="Privacy Policy"
      subtitle="Last updated: 6 October 2026"
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">What we collect</h2>
        <p>
          We collect the account details you provide (name, email, agency) and
          the CRM records you create (leads, properties, viewings, deals and
          communications). Authentication and billing are handled by Clerk;
          payments are processed by Clerk Billing (Stripe).
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">How we use it</h2>
        <p>
          Your data is used solely to provide the service — pipeline management,
          task prioritisation, AI-drafted messages and reports. Data is stored in
          Neon Postgres and files in Vercel Blob, and every record is scoped to
          your workspace.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Sharing</h2>
        <p>
          We do not sell your data. We share it only with the processors needed
          to run Arkynex (Vercel, Neon, Clerk, Resend, Twilio and, where enabled,
          the AI provider configured for your deployment).
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Your rights</h2>
        <p>
          You can export your leads and deals as CSV at any time, and you can
          request deletion of your account and data by contacting{" "}
          <a
            href="mailto:privacy@arkynex.com"
            className="font-medium text-primary hover:text-primary-hover"
          >
            privacy@arkynex.com
          </a>
          .
        </p>
      </section>
    </MarketingPage>
  );
}
