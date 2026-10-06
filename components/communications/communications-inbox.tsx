"use client";

import { useState } from "react";
import { Mail, Phone, Search, StickyNote, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { RealtimeThread } from "@/components/communications/realtime-thread";
import { cn } from "@/lib/utils";
import type { ConversationSummary, Communication } from "@/lib/db/queries/communications";
import { loadThread } from "@/lib/db/mutations/communications";

const CHANNEL_ICON: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  note: StickyNote,
};

function formatTime(iso: string | Date) {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CommunicationsInbox({
  initialConversations,
}: {
  initialConversations: ConversationSummary[];
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialConversations[0]?.leadId ?? null,
  );
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [threadMessages, setThreadMessages] = useState<Communication[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const filtered = initialConversations.filter((c) =>
    c.leadName.toLowerCase().includes(query.toLowerCase()),
  );

  const selected = initialConversations.find((c) => c.leadId === selectedId);

  async function selectConversation(leadId: string) {
    if (leadId === selectedId && mobileShowThread) return;
    setSelectedId(leadId);
    setMobileShowThread(true);
    setLoadingThread(true);

    const thread = await loadThread(leadId);
    setThreadMessages(thread?.messages ?? []);
    setLoadingThread(false);
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[480px] overflow-hidden rounded-2xl border border-line bg-card">
      {/* Conversation list */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-line sm:w-80",
          mobileShowThread ? "hidden sm:flex" : "flex",
        )}
      >
        <div className="border-b border-line p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-ink-muted">
            {initialConversations.length === 0
              ? "No conversations yet. Create a lead and log your first note."
              : "No conversations match your search."}
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {filtered.map((conv) => {
              const active = conv.leadId === selectedId;
              const Icon = CHANNEL_ICON[conv.lastMessage.channel] ?? StickyNote;

              return (
                <li key={conv.leadId}>
                  <button
                    type="button"
                    onClick={() => selectConversation(conv.leadId)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface",
                      active && "bg-primary/5",
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {conv.leadName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">{conv.leadName}</p>
                        <span className="shrink-0 text-[11px] text-ink-muted">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                        <Icon className="h-3 w-3 shrink-0" />
                        <p className="truncate">
                          {conv.lastMessage.content ?? conv.lastMessage.channel}
                        </p>
                      </div>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Thread */}
      <div
        className={cn(
          "min-w-0 flex-1 flex-col",
          mobileShowThread ? "flex" : "hidden sm:flex",
        )}
      >
        {!selected ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-muted">
            Select a conversation to see the full timeline.
          </div>
        ) : loadingThread ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <RealtimeThread
            key={selected.leadId}
            leadId={selected.leadId}
            leadName={selected.leadName}
            leadPhone={selected.leadPhone}
            initialMessages={threadMessages}
          />
        )}
      </div>
    </div>
  );
}
