"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, MessageCircle, Phone, Send, StickyNote, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { logNote, logWhatsApp } from "@/lib/supabase/mutations/communications";
import { Input } from "@/components/ui/input";
import type { CommunicationRow } from "@/lib/supabase/queries/communications";

const CHANNEL_ICON: Record<string, LucideIcon> = {
  whatsapp: MessageCircle,
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  note: StickyNote,
};

const STATUS_COLOR: Record<string, string> = {
  read: "text-primary",
  delivered: "text-ink-muted",
  sent: "text-ink-muted/60",
  failed: "text-status-lost",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageBubble({ msg }: { msg: CommunicationRow }) {
  const isOutbound = msg.direction === "outbound";

  if (msg.channel === "note") {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-primary/5 px-3.5 py-2.5">
        <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary">Note</p>
          <p className="mt-0.5 text-sm text-ink">{msg.content}</p>
        </div>
        <span className="shrink-0 text-[10px] text-ink-muted">{formatTime(msg.created_at)}</span>
      </div>
    );
  }

  if (msg.channel === "call") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5">
        <Phone className="h-4 w-4 shrink-0 text-ink-muted" />
        <div className="flex-1 text-sm">
          <span className="text-ink">{isOutbound ? "Outbound call" : "Inbound call"}</span>
          {msg.call_outcome && (
            <span className="text-ink-muted"> · {msg.call_outcome.replace("_", " ")}</span>
          )}
          {msg.duration_seconds ? (
            <span className="text-ink-muted"> · {msg.duration_seconds}s</span>
          ) : null}
          {msg.content && <p className="mt-0.5 text-xs text-ink-muted">{msg.content}</p>}
        </div>
        <span className="shrink-0 text-[10px] text-ink-muted">{formatTime(msg.created_at)}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
          isOutbound ? "rounded-tr-sm bg-primary text-white" : "rounded-tl-sm bg-surface text-ink"
        }`}
      >
        {msg.content}
      </div>
      <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-muted">
        {formatTime(msg.created_at)}
        {isOutbound && msg.wa_status && (
          <span className={STATUS_COLOR[msg.wa_status] ?? "text-ink-muted"}>
            · {msg.wa_status}
          </span>
        )}
      </div>
    </div>
  );
}

export function RealtimeThread({
  leadId,
  leadName,
  leadPhone,
  initialMessages,
}: {
  leadId: string;
  leadName: string;
  leadPhone: string;
  initialMessages: CommunicationRow[];
}) {
  const [messages, setMessages] = useState<CommunicationRow[]>(initialMessages);
  const [noteText, setNoteText] = useState("");
  const [waText, setWaText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`communications:lead_id=eq.${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "communications",
          filter: `lead_id=eq.${leadId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as CommunicationRow];
          });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [leadId]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {leadName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{leadName}</p>
          <p className="truncate text-xs text-ink-muted">{leadPhone}</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs text-status-closed">
          <span className="h-1.5 w-1.5 rounded-full bg-status-closed" />
          Live
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-ink-muted">
            No messages yet. Log a note or send a WhatsApp below.
          </p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="space-y-2 border-t border-line p-4">
        {/* Note */}
        <form className="flex gap-2">
          <input type="hidden" name="leadId" value={leadId} />
          <Input
            name="content"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Log a note..."
            className="h-9 flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            formAction={async (fd) => { await logNote(fd); setNoteText(""); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-ink-muted transition-colors hover:bg-primary/10 hover:text-primary"
            title="Save note"
          >
            <StickyNote className="h-4 w-4" />
          </button>
        </form>

        {/* WhatsApp */}
        <form className="flex gap-2">
          <input type="hidden" name="leadId" value={leadId} />
          <Input
            name="content"
            value={waText}
            onChange={(e) => setWaText(e.target.value)}
            placeholder="Send WhatsApp message..."
            className="h-9 flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            formAction={async (fd) => { await logWhatsApp(fd); setWaText(""); }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover"
            title="Send WhatsApp"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
