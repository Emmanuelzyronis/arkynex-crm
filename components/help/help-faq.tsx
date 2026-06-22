"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { faqs } from "@/lib/mock-help";

export function HelpFaq() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return faqs;
    return faqs.filter(
      (faq) => faq.question.toLowerCase().includes(q) || faq.answer.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles..."
          className="pl-9"
        />
      </div>

      <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-card">
        {filtered.map((faq) => (
          <details key={faq.question} className="group p-4 sm:p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{faq.answer}</p>
          </details>
        ))}

        {filtered.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">
            No help articles match &quot;{query}&quot;.
          </p>
        )}
      </div>
    </div>
  );
}
