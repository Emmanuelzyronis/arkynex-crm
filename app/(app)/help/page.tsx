import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HelpCategories } from "@/components/help/help-categories";
import { HelpFaq } from "@/components/help/help-faq";

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Help &amp; Support</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Browse common topics or search for an answer below.
        </p>
      </div>

      <HelpCategories />

      <div>
        <h2 className="text-base font-semibold text-ink">Frequently asked questions</h2>
        <div className="mt-3">
          <HelpFaq />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-ink">Still need help?</p>
          <p className="mt-1 text-sm text-ink-muted">Our team typically responds within a few hours.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href="mailto:support@arkynex.com">
              <Mail className="h-4 w-4" />
              Email support
            </a>
          </Button>
          <Button asChild>
            <a href="mailto:support@arkynex.com?subject=Arkynex%20support">
              <Mail className="h-4 w-4" />
              Contact support
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
