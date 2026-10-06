import type { Metadata } from "next";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "Contact — Arkynex",
  description: "Get in touch with the Arkynex team.",
};

export default function ContactPage() {
  return (
    <MarketingPage
      title="Talk to us"
      subtitle="Questions about pricing, teams or onboarding? We usually reply within one business day."
    >
      <div className="space-y-4">
        <p>
          Email:{" "}
          <a
            href="mailto:hello@arkynex.com"
            className="font-medium text-primary hover:text-primary-hover"
          >
            hello@arkynex.com
          </a>
        </p>
        <p>
          Sales and team plans:{" "}
          <a
            href="mailto:sales@arkynex.com"
            className="font-medium text-primary hover:text-primary-hover"
          >
            sales@arkynex.com
          </a>
        </p>
        <p>
          Support:{" "}
          <a
            href="mailto:support@arkynex.com"
            className="font-medium text-primary hover:text-primary-hover"
          >
            support@arkynex.com
          </a>
        </p>
      </div>
      <p>
        Already using Arkynex? The in-app Help Center (Settings → Help) has
        step-by-step guides for leads, listings, viewings and deals.
      </p>
    </MarketingPage>
  );
}
