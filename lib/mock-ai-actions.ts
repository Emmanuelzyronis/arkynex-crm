import { ACCENTS } from "@/lib/mock-properties";

export type ActionPriority = "urgent" | "today" | "this_week";

export type ActionType =
  | "follow_up"
  | "call_back"
  | "send_property"
  | "confirm_viewing"
  | "re_engage"
  | "log_outcome"
  | "close_deal"
  | "check_deal";

export type AIAction = {
  id: string;
  priority: ActionPriority;
  actionType: ActionType;
  title: string;
  body: string;
  suggestedMessage?: string;
  leadName?: string;
  relatedTo?: string;
  accent: string;
};

export const priorityConfig: Record<ActionPriority, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "#EF4444" },
  today: { label: "Today", color: "#F59E0B" },
  this_week: { label: "This Week", color: "#3B82F6" },
};

export const priorityOrder: ActionPriority[] = ["urgent", "today", "this_week"];

export const mockAIActions: AIAction[] = [
  {
    id: "a1",
    priority: "urgent",
    actionType: "follow_up",
    title: "Follow up with Marcus Bennett",
    body: "Marcus messaged 2 hours ago asking for Downtown listings but hasn't received a reply yet. High-intent lead — score 98.",
    suggestedMessage:
      "Hi Marcus, here are 3 apartments in Downtown matching your budget — let me know which you'd like to view!",
    leadName: "Marcus Bennett",
    accent: ACCENTS[0],
  },
  {
    id: "a2",
    priority: "urgent",
    actionType: "confirm_viewing",
    title: "Confirm today's viewing with Sofia Alvarez",
    body: "The viewing for the 2 Bedroom Flat in Greenwood is scheduled for 4:30 PM today but hasn't been confirmed.",
    suggestedMessage:
      "Hi Sofia, just confirming our viewing today at 4:30 PM for the Greenwood flat — see you then!",
    leadName: "Sofia Alvarez",
    relatedTo: "2 Bedroom Flat · Greenwood",
    accent: ACCENTS[3],
  },
  {
    id: "a3",
    priority: "urgent",
    actionType: "check_deal",
    title: "Review stalled deal: Waterfront Land",
    body: "Closing probability for Aisha Rahman's land deal dropped to 30% with no contact in 6 days.",
    leadName: "Aisha Rahman",
    relatedTo: "Waterfront Land · Harbor Island",
    accent: ACCENTS[2],
  },
  {
    id: "a4",
    priority: "today",
    actionType: "re_engage",
    title: "Re-engage Priya Nair",
    body: "Priya sent a new message about the Harbor Island listing. Reply within the hour to keep momentum.",
    suggestedMessage:
      "Hi Priya! Yes, there's some flexibility on price — happy to discuss further. When works for a quick call?",
    leadName: "Priya Nair",
    accent: ACCENTS[2],
  },
  {
    id: "a5",
    priority: "today",
    actionType: "send_property",
    title: "Send 3 properties to Liam O'Connor",
    body: "Liam confirmed interest via email and is requesting a viewing slot — share matching duplexes in Riverside and Chelsea.",
    suggestedMessage:
      "Hi Liam, here are 3 duplexes that match your brief — let me know which to book a viewing for.",
    leadName: "Liam O'Connor",
    accent: ACCENTS[1],
  },
  {
    id: "a6",
    priority: "today",
    actionType: "log_outcome",
    title: "Log outcome for yesterday's viewing",
    body: "Emily Carter viewed the Studio in Maplewood yesterday at 2:30 PM. Add agent notes and a rating.",
    leadName: "Emily Carter",
    relatedTo: "1 Bedroom Studio · Maplewood",
    accent: ACCENTS[4],
  },
  {
    id: "a7",
    priority: "this_week",
    actionType: "close_deal",
    title: "Move Sean Whitfield' deal to Completed",
    body: "Docs for the Riverside duplex are fully signed — mark this deal as completed and record commission.",
    leadName: "Sean Whitfield",
    relatedTo: "4 Bedroom Duplex · Riverside",
    accent: ACCENTS[4],
  },
  {
    id: "a8",
    priority: "this_week",
    actionType: "call_back",
    title: "Call back Daniel Reyes",
    body: "Daniel is ready to proceed with an offer on the Chelsea office suite — schedule a call to discuss terms.",
    leadName: "Daniel Reyes",
    relatedTo: "Office Suite, 6th Floor · Chelsea",
    accent: ACCENTS[2],
  },
  {
    id: "a9",
    priority: "this_week",
    actionType: "follow_up",
    title: "Check in with Grace Kim",
    body: "The Commercial Plaza deal fell through last week. Follow up to understand requirements before relisting.",
    leadName: "Grace Kim",
    relatedTo: "Commercial Plaza · Midtown",
    accent: ACCENTS[3],
  },
];
