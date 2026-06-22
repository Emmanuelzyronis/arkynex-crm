import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";

import { Logo } from "@/components/landing/logo";

const footerLinks: Record<string, string[]> = {
  Product: ["Features", "Pricing", "WhatsApp Integration", "AI Actions"],
  Company: ["About", "Careers", "Blog"],
  Resources: ["Help Center", "Guides", "API Docs"],
  Legal: ["Privacy Policy", "Terms of Service"],
};

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-ink-muted">
              AI-powered CRM for real estate agents — leads, viewings,
              properties and deals in one place.
            </p>
            <div className="mt-5 flex gap-4 text-ink-muted">
              <a href="#" aria-label="Arkynex on X">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Arkynex on LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Arkynex on Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-sm font-semibold text-ink">{heading}</p>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-8 sm:flex-row">
          <p className="text-xs text-ink-muted">
            © {year} Arkynex. All rights reserved.
          </p>
          <p className="text-xs text-ink-muted">
            Built for modern agents in Lagos, Abuja &amp; beyond.
          </p>
        </div>
      </div>
    </footer>
  );
}
