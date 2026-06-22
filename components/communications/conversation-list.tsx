import { Mail, MessageCircle, MessageSquare, Phone, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { initials } from "@/lib/mock-leads";
import type { Channel, Conversation } from "@/lib/mock-communications";
import { cn } from "@/lib/utils";

const channelIcon: Record<Channel, LucideIcon> = {
  whatsapp: MessageCircle,
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  note: StickyNote,
};

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="flex-1 divide-y divide-line overflow-y-auto">
      {conversations.map((conversation) => {
        const Icon = channelIcon[conversation.lastChannel];
        const active = conversation.leadId === selectedId;

        return (
          <li key={conversation.leadId}>
            <button
              type="button"
              onClick={() => onSelect(conversation.leadId)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface",
                active && "bg-primary/5",
              )}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${conversation.accent}1A`, color: conversation.accent }}
              >
                {initials(conversation.leadName)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-ink">{conversation.leadName}</p>
                  <span className="shrink-0 text-[11px] text-ink-muted">
                    {conversation.lastMessageTime}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Icon className="h-3 w-3 shrink-0" />
                  <p className="truncate">{conversation.lastMessagePreview}</p>
                </div>
              </div>

              {conversation.unread && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          </li>
        );
      })}

      {conversations.length === 0 && (
        <li className="px-4 py-10 text-center text-sm text-ink-muted">No conversations found.</li>
      )}
    </ul>
  );
}
