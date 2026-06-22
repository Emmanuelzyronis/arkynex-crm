import { AlertCircle, ArrowLeft, Check, CheckCheck, Mail, Phone, Sparkles, StickyNote } from "lucide-react";

import { initials } from "@/lib/mock-leads";
import {
  callOutcomeLabels,
  formatDuration,
  type Conversation,
  type Message,
  type WaStatus,
} from "@/lib/mock-communications";
import { cn } from "@/lib/utils";

function WaStatusIcon({ status }: { status: WaStatus }) {
  if (status === "read") return <CheckCheck className="h-3 w-3 text-primary" />;
  if (status === "delivered") return <CheckCheck className="h-3 w-3" />;
  if (status === "failed") return <AlertCircle className="h-3 w-3 text-status-lost" />;
  return <Check className="h-3 w-3" />;
}

function MessageItem({ message }: { message: Message }) {
  if (message.channel === "whatsapp" || message.channel === "sms") {
    const isOutbound = message.direction === "outbound";
    return (
      <div className={cn("flex flex-col", isOutbound ? "items-end" : "items-start")}>
        <div
          className={cn(
            "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
            isOutbound ? "rounded-tr-sm bg-primary text-white" : "rounded-tl-sm bg-surface text-ink",
          )}
        >
          {message.content}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-muted">
          {message.time}
          {isOutbound && message.waStatus && <WaStatusIcon status={message.waStatus} />}
        </div>
      </div>
    );
  }

  if (message.channel === "call") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-line px-3.5 py-2.5">
        <Phone className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink">
            {message.direction === "outbound" ? "Outbound call" : "Inbound call"}
            {message.callOutcome ? ` · ${callOutcomeLabels[message.callOutcome]}` : ""}
            {message.durationSeconds ? ` · ${formatDuration(message.durationSeconds)}` : ""}
          </p>
          {message.content && <p className="mt-0.5 text-xs text-ink-muted">{message.content}</p>}
        </div>
        <span className="shrink-0 text-xs text-ink-muted">{message.time}</span>
      </div>
    );
  }

  if (message.channel === "email") {
    return (
      <div className="rounded-xl border border-line px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
            <Mail className="h-3.5 w-3.5" />
            {message.direction === "outbound" ? "Email sent" : "Email received"}
          </span>
          <span className="text-xs text-ink-muted">{message.time}</span>
        </div>
        <p className="mt-1.5 text-sm text-ink">{message.content}</p>
      </div>
    );
  }

  // note (agent-written or AI-generated)
  const isAi = message.isAiSummary;
  return (
    <div className={cn("rounded-xl px-3.5 py-2.5", isAi ? "bg-primary/5" : "bg-surface")}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            isAi ? "text-primary" : "text-ink-muted",
          )}
        >
          {isAi ? <Sparkles className="h-3.5 w-3.5" /> : <StickyNote className="h-3.5 w-3.5" />}
          {isAi ? "AI Summary" : "Note"}
        </span>
        <span className="text-xs text-ink-muted">{message.time}</span>
      </div>
      <p className="mt-1.5 text-sm text-ink">{message.content}</p>
    </div>
  );
}

export function ConversationThread({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button
          type="button"
          aria-label="Back to conversations"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink sm:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          style={{ backgroundColor: `${conversation.accent}1A`, color: conversation.accent }}
        >
          {initials(conversation.leadName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{conversation.leadName}</p>
          <p className="truncate text-xs text-ink-muted">{conversation.leadPhone}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {conversation.messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
}
