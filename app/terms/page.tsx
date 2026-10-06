import type { Metadata } from "next";

import { MarketingPage } from "@/components/landing/marketing-page";

export const metadata: Metadata = {
  title: "Terms of Service — Arkynex",
  description: "The terms that govern your use of Arkynex.",
};

export default function TermsPage() {
  return (
    <MarketingPage
      title="Terms of Service"
      subtitle="Last updated: 6 October 2026"
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Using Arkynex</h2>
        <p>
          You may use Arkynex only for lawful business purposes and in
          compliance with the laws that apply to you. You are responsible for
          the accuracy of the data you enter and for keeping your account
          credentials secure.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Subscriptions & trials</h2>
        <p>
          New accounts start with a 15-day free trial. Paid plans are billed
          through Clerk Billing (Stripe) and renew automatically until cancelled.
          You can cancel at any time and retain access until the end of the
          current period.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Availability</h2>
        <p>
          We work hard to keep Arkynex available, but the service is provided
          &ldquo;as is&rdquo; without warranties. AI-generated content is a
          drafting aid — you remain responsible for reviewing anything you send
          to a client.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">Contact</h2>
        <p>
          Questions about these terms? Email{" "}
          <a
            href="mailto:legal@arkynex.com"
            className="font-medium text-primary hover:text-primary-hover"
          >
            legal@arkynex.com
          </a>
          .
        </p>
      </section>
    </MarketingPage>
  );
}
