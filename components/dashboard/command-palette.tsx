"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Handshake, Loader2, Search, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatMoneyCompact } from "@/lib/currency";

type SearchResults = {
  leads: { id: string; fullName: string; phone: string; stage: string }[];
  properties: { id: string; title: string; city: string; area: string | null; price: number }[];
  deals: { id: string; leadName: string; propertyTitle: string; stage: string }[];
};

type Item = {
  key: string;
  group: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
};

const EMPTY: SearchResults = { leads: [], properties: [], deals: [] };

export function SearchTrigger() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const lead of results.leads) {
      out.push({
        key: `lead-${lead.id}`,
        group: "Leads",
        icon: Users,
        title: lead.fullName,
        subtitle: lead.phone,
        href: `/leads/${lead.id}`,
      });
    }
    for (const property of results.properties) {
      out.push({
        key: `property-${property.id}`,
        group: "Properties",
        icon: Building2,
        title: property.title,
        subtitle: [property.area ?? property.city, formatMoneyCompact(property.price)]
          .filter(Boolean)
          .join(" · "),
        href: `/properties/${property.id}`,
      });
    }
    for (const deal of results.deals) {
      out.push({
        key: `deal-${deal.id}`,
        group: "Deals",
        icon: Handshake,
        title: deal.leadName,
        subtitle: `${deal.propertyTitle} · ${deal.stage.replace(/_/g, " ")}`,
        href: "/deals",
      });
    }
    return out;
  }, [results]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(timer);
    }
    setQuery("");
    setResults(EMPTY);
    setActive(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          setResults((await res.json()) as SearchResults);
          setActive(0);
        }
      } catch {
        // request aborted or failed — keep previous results
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [query, open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((prev) => Math.min(prev + 1, Math.max(items.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter" && items[active]) {
      event.preventDefault();
      go(items[active].href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <Search className="h-[18px] w-[18px]" />
        <span className="hidden text-sm sm:inline">Search</span>
        <kbd className="hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-ink-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-auto mt-[12vh] w-[92%] max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-4 w-4 shrink-0 text-ink-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search leads, properties and deals…"
                className="h-14 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />}
            </div>

            <ul className="max-h-80 overflow-y-auto p-2">
              {query.trim().length < 2 && (
                <li className="px-3 py-6 text-center text-sm text-ink-muted">
                  Type at least 2 characters to search.
                </li>
              )}

              {query.trim().length >= 2 &&
                items.map((item, index) => {
                  const Icon = item.icon;
                  const showGroup = index === 0 || items[index - 1].group !== item.group;
                  return (
                    <li key={item.key}>
                      {showGroup && (
                        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                          {item.group}
                        </p>
                      )}
                      <button
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(item.href)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                          active === index ? "bg-primary/10" : "hover:bg-surface",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-ink-muted" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            {item.subtitle}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}

              {query.trim().length >= 2 && !loading && items.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-ink-muted">
                  No matches for “{query.trim()}”.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
