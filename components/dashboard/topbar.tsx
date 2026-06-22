import { Menu, Search } from "lucide-react";

import { LogoMark } from "@/components/landing/logo";
import { UserMenu } from "@/components/dashboard/user-menu";
import { LiveActionBell } from "@/components/dashboard/live-action-bell";
import type { Tables } from "@/lib/supabase/types";

export function TopBar({
  onMenuClick,
  profile,
  userId,
  pendingActionCount,
}: {
  onMenuClick: () => void;
  profile: Tables<"profiles"> | null;
  userId: string;
  pendingActionCount: number;
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-line/70 bg-card px-4 lg:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <Menu className="h-5 w-5" />
        </button>
        <LogoMark className="h-7 w-7" />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <button
          type="button"
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <Search className="h-5 w-5" />
        </button>
        <LiveActionBell userId={userId} initialCount={pendingActionCount} />
        <UserMenu profile={profile} />
      </div>
    </header>
  );
}
