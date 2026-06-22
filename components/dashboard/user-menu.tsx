"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, Settings, User } from "lucide-react";

import { signout } from "@/lib/supabase/actions/auth";
import { initials } from "@/lib/mock-leads";
import type { Tables } from "@/lib/supabase/types";

export function UserMenu({ profile }: { profile: Tables<"profiles"> | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const name = profile?.full_name ?? "Agent";
  const avatar = initials(name);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="User menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
      >
        {avatar}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-line bg-card py-1 shadow-xl shadow-ink/10">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">{name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              {profile?.agency_name ?? ""}
            </p>
          </div>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>

          <div className="my-1 border-t border-line" />

          <form>
            <button
              type="submit"
              formAction={signout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-status-lost transition-colors hover:bg-status-lost/5"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
