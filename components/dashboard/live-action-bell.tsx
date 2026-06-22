"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Sparkles } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export function LiveActionBell({
  userId,
  initialCount,
}: {
  userId: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [justArrived, setJustArrived] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`ai_actions:agent_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_actions",
          filter: `agent_id=eq.${userId}`,
        },
        () => {
          setCount((c) => c + 1);
          setJustArrived(true);
          setTimeout(() => setJustArrived(false), 2000);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ai_actions",
          filter: `agent_id=eq.${userId}`,
        },
        (payload) => {
          // If an action was just completed/dismissed, decrement
          const wasActive = !payload.old.completed && !payload.old.dismissed;
          const isActive = !payload.new.completed && !payload.new.dismissed;
          if (wasActive && !isActive) {
            setCount((c) => Math.max(0, c - 1));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return (
    <Link
      href="/ai-actions"
      aria-label="AI Actions"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-negotiating px-1 text-[9px] font-bold text-white transition-transform ${
            justArrived ? "scale-125" : "scale-100"
          }`}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
