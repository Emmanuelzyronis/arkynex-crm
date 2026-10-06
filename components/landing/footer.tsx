import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";

import { Logo } from "@/components/landing/logo";

const footerLinks: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "AI Actions", href: "/ai-actions" },
      { label: "Reports", href: "/reports" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const socialLinks = [
  { label: "Arkynex on X", href: "https://x.com/arkynex", icon: Twitter },
  { label: "Arkynex on LinkedIn", href: "https://www.linkedin.com/company/arkynex", icon: Linkedin },
  { label: "Arkynex on Instagram", href: "https://www.instagram.com/arkynex", icon: Instagram },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-4">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-ink-muted">
              AI-powered CRM for real estate agents — leads, viewings,
              properties and deals in one place.
            </p>
            <div className="mt-5 flex gap-4 text-ink-muted">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-ink"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map(({ title, links }) => (
            <div key={title}>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
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
            Built for modern agents and teams worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
