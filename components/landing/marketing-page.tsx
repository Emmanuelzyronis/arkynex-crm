import Link from "next/link";

import { Nav } from "@/components/landing/nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";

export function MarketingPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main>
      <Nav />
      <section className="mx-auto max-w-3xl px-6 py-20 lg:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-3 text-ink-muted">{subtitle}</p>}
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-muted">
          {children}
        </div>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-line pt-8">
          <Button asChild>
            <Link href="/signup">Start free trial</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </section>
      <Footer />
    </main>
  );
}
