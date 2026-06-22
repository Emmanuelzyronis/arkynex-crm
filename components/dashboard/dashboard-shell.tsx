"use client";

import { useState } from "react";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";
import type { Tables } from "@/lib/supabase/types";

export function DashboardShell({
  children,
  profile,
  userId,
  pendingActionCount,
}: {
  children: React.ReactNode;
  profile: Tables<"profiles"> | null;
  userId: string;
  pendingActionCount: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          profile={profile}
          userId={userId}
          pendingActionCount={pendingActionCount}
        />
        <main className="flex-1 px-6 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
