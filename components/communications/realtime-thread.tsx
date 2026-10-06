"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, Phone, Send, Sparkles, StickyNote, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import Ably from "ably";
import {
  draftLeadMessage,
  logNote,
  sendEmailToLead,
  sendSmsToLead,
} from "@/lib/db/mutations/communications";
import { Input } from "@/components/ui/input";
import type { Communication } from "@/lib/db/queries/communications";

const CHANNEL_ICON: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  note: StickyNote,
};


function formatTime(iso: string | Date) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageBubble({ msg }: { msg: Communication }) {
  const isOutbound = msg.direction === "outbound";

  if (msg.channel === "note") {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-primary/5 px-3.5 py-2.5">
        <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary">Note</p>
          <p className="mt-0.5 text-sm text-ink">{msg.content}</p>
        </div>
        <span className="shrink-0 text-[10px] text-ink-muted">{formatTime(msg.createdAt)}</span>
      </div>
    );
  }

  if (msg.channel === "call") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5">
        <Phone className="h-4 w-4 shrink-0 text-ink-muted" />
        <div className="flex-1 text-sm">
          <span className="text-ink">{isOutbound ? "Outbound call" : "Inbound call"}</span>
          {msg.callOutcome && (
            <span className="text-ink-muted"> · {msg.callOutcome.replace("_", " ")}</span>
          )}
          {msg.durationSeconds ? (
            <span className="text-ink-muted"> · {msg.durationSeconds}s</span>
          ) : null}
          {msg.content && <p className="mt-0.5 text-xs text-ink-muted">{msg.content}</p>}
        </div>
        <span className="shrink-0 text-[10px] text-ink-muted">{formatTime(msg.createdAt)}</span>
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
        {formatTime(msg.createdAt)}
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
  initialMessages: Communication[];
}) {
  const [messages, setMessages] = useState<Communication[]>(initialMessages);
  const [channel, setChannel] = useState<"note" | "email" | "sms">("note");
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleSend() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.set("leadId", leadId);
      fd.set("content", text.trim());

      if (channel === "note") {
        await logNote(fd);
        setNotice("Note saved.");
      } else {
        if (channel === "email") fd.set("subject", subject.trim() || "Following up");
        const result =
          channel === "email" ? await sendEmailToLead(fd) : await sendSmsToLead(fd);
        if (result.delivered) {
          setNotice(channel === "email" ? "Email sent." : "SMS sent.");
        } else if (result.error === "not_configured") {
          setNotice("Logged — delivery provider not configured.");
        } else {
          setNotice(`Logged — delivery failed (${result.error}).`);
        }
      }
      setText("");
      setSubject("");
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDraft() {
    if (busy) return;
    setBusy(true);
    setNotice("Drafting…");
    try {
      const res = await draftLeadMessage(leadId);
      if (res.ok && res.draft) {
        setText(res.draft);
        setNotice("Draft ready — review and send.");
      } else if (res.error === "llm_not_configured") {
        setNotice("AI drafting is not configured.");
      } else {
        setNotice("Could not draft a reply right now.");
      }
    } finally {
      setBusy(false);
    }
  }

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ably realtime subscription (no-op until ABLY_SERVER_KEY is configured)
  useEffect(() => {
    const client = new Ably.Realtime({ authUrl: "/api/realtime/token" });
    const channel = client.channels.get(`communications:${leadId}`);

    const handler = (message: Ably.Message) => {
      const row = message.data as Communication;
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
    };

    channel.subscribe("communication", handler);

    return () => {
      channel.unsubscribe("communication", handler);
      client.close();
    };
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
            No messages yet. Log a note below.
          </p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="space-y-2 border-t border-line p-4">
        <div className="flex items-center gap-1">
          {(["note", "email", "sms"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => { setChannel(c); setNotice(null); }}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                channel === c
                  ? "bg-primary/10 text-primary"
                  : "text-ink-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {c === "sms" ? "SMS" : c}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDraft}
            disabled={busy}
            className="ml-auto flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            title="Draft a follow-up with AI"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Draft with AI
          </button>
        </div>

        {channel === "email" && (
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="h-9 text-sm"
          />
        )}

        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              channel === "note"
                ? "Log a note..."
                : channel === "email"
                  ? "Write an email..."
                  : "Write an SMS..."
            }
            className="h-9 flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={busy || !text.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-ink-muted transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            title={channel === "note" ? "Save note" : `Send ${channel}`}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : channel === "note" ? (
              <StickyNote className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {notice && <p className="text-[11px] text-ink-muted">{notice}</p>}
      </div>
    </div>
  );
}
