import type { Metadata } from "next";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "About — Arkynex",
  description: "Why we built Arkynex, the AI CRM for real estate agents and teams.",
};

export default function AboutPage() {
  return (
    <MarketingPage
      title="Built so no lead ever goes cold"
      subtitle="Arkynex is the all-in-one CRM for real estate agents, teams and agencies."
    >
      <p>
        Real estate is won on follow-up. When an enquiry lands, the agent who
        responds first usually wins the client — yet most agents juggle leads,
        viewings, listings and deals across spreadsheets, notes and inboxes.
      </p>
      <p>
        Arkynex brings the whole pipeline into one place: capture every lead,
        track listings and viewings, log every conversation, and let AI tell you
        exactly who to call next. Teams share one workspace with round-robin
        routing, so nothing slips through the cracks.
      </p>
      <p>
        We built Arkynex to be fast, dependable and honest about what it does:
        deterministic, auditable scoring for prioritisation, and real language
        models for drafting the follow-ups you actually send.
      </p>
    </MarketingPage>
  );
}
