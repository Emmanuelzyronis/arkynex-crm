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
    title: "Follow up with Tunde Adebayo",
    body: "Tunde messaged 2 hours ago asking for Victoria Island listings but hasn't received a reply yet. High-intent lead — score 98.",
    suggestedMessage:
      "Hi Tunde, here are 3 apartments in Victoria Island matching your budget — let me know which you'd like to view!",
    leadName: "Tunde Adebayo",
    accent: ACCENTS[0],
  },
  {
    id: "a2",
    priority: "urgent",
    actionType: "confirm_viewing",
    title: "Confirm today's viewing with Bolanle Adeyemi",
    body: "The viewing for the 2 Bedroom Flat in Ajah is scheduled for 4:30 PM today but hasn't been confirmed.",
    suggestedMessage:
      "Hi Bolanle, just confirming our viewing today at 4:30 PM for the Ajah flat — see you then!",
    leadName: "Bolanle Adeyemi",
    relatedTo: "2 Bedroom Flat · Ajah",
    accent: ACCENTS[3],
  },
  {
    id: "a3",
    priority: "urgent",
    actionType: "check_deal",
    title: "Review stalled deal: Waterfront Land",
    body: "Closing probability for Aisha Bello's land deal dropped to 30% with no contact in 6 days.",
    leadName: "Aisha Bello",
    relatedTo: "Waterfront Land · Banana Island",
    accent: ACCENTS[2],
  },
  {
    id: "a4",
    priority: "today",
    actionType: "re_engage",
    title: "Re-engage Chidinma Eze",
    body: "Chidinma sent a new message about the Banana Island listing. Reply within the hour to keep momentum.",
    suggestedMessage:
      "Hi Chidinma! Yes, there's some flexibility on price — happy to discuss further. When works for a quick call?",
    leadName: "Chidinma Eze",
    accent: ACCENTS[2],
  },
  {
    id: "a5",
    priority: "today",
    actionType: "send_property",
    title: "Send 3 properties to Ibrahim Mohammed",
    body: "Ibrahim confirmed interest via email and is requesting a viewing slot — share matching duplexes in Lekki and Ikoyi.",
    suggestedMessage:
      "Hi Ibrahim, here are 3 duplexes that match your brief — let me know which to book a viewing for.",
    leadName: "Ibrahim Mohammed",
    accent: ACCENTS[1],
  },
  {
    id: "a6",
    priority: "today",
    actionType: "log_outcome",
    title: "Log outcome for yesterday's viewing",
    body: "Funke Okoro viewed the Studio in Surulere yesterday at 2:30 PM. Add agent notes and a rating.",
    leadName: "Funke Okoro",
    relatedTo: "1 Bedroom Studio · Surulere",
    accent: ACCENTS[4],
  },
  {
    id: "a7",
    priority: "this_week",
    actionType: "close_deal",
    title: "Move Segun Williams' deal to Completed",
    body: "Docs for the Lekki Phase 1 duplex are fully signed — mark this deal as completed and record commission.",
    leadName: "Segun Williams",
    relatedTo: "4 Bedroom Duplex · Lekki Phase 1",
    accent: ACCENTS[4],
  },
  {
    id: "a8",
    priority: "this_week",
    actionType: "call_back",
    title: "Call back Emeka Okafor",
    body: "Emeka is ready to proceed with an offer on the Ikoyi office suite — schedule a call to discuss terms.",
    leadName: "Emeka Okafor",
    relatedTo: "Office Suite, 6th Floor · Ikoyi",
    accent: ACCENTS[2],
  },
  {
    id: "a9",
    priority: "this_week",
    actionType: "follow_up",
    title: "Check in with Ngozi Umeh",
    body: "The Commercial Plaza deal fell through last week. Follow up to understand requirements before relisting.",
    leadName: "Ngozi Umeh",
    relatedTo: "Commercial Plaza · Yaba",
    accent: ACCENTS[3],
  },
];
