import { ACCENTS } from "@/lib/mock-properties";

export type Channel = "whatsapp" | "call" | "email" | "sms" | "note";
export type Direction = "inbound" | "outbound";
export type CallOutcome = "answered" | "no_answer" | "busy" | "voicemail";
export type WaStatus = "sent" | "delivered" | "read" | "failed";

export type Message = {
  id: string;
  channel: Channel;
  direction?: Direction;
  content?: string;
  durationSeconds?: number;
  callOutcome?: CallOutcome;
  waStatus?: WaStatus;
  time: string;
  /** Marks a `note` as AI-generated (vs. one the agent typed). */
  isAiSummary?: boolean;
};

export type Conversation = {
  leadId: string;
  leadName: string;
  leadPhone: string;
  lastChannel: Channel;
  lastMessagePreview: string;
  lastMessageTime: string;
  unread: boolean;
  accent: string;
  messages: Message[];
};

export const callOutcomeLabels: Record<CallOutcome, string> = {
  answered: "Answered",
  no_answer: "No Answer",
  busy: "Busy",
  voicemail: "Voicemail",
};

export function formatDuration(seconds: number) {
  if (seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export const mockConversations: Conversation[] = [
  {
    leadId: "5",
    leadName: "Chidinma Eze",
    leadPhone: "+234 805 678 9012",
    lastChannel: "whatsapp",
    lastMessagePreview: "I saw the Banana Island listing — is it negotiable?",
    lastMessageTime: "5m ago",
    unread: true,
    accent: ACCENTS[2],
    messages: [
      {
        id: "5-1",
        channel: "whatsapp",
        direction: "inbound",
        content: "I saw the Banana Island listing — is it negotiable?",
        time: "9:12 AM",
        waStatus: "delivered",
      },
    ],
  },
  {
    leadId: "1",
    leadName: "Tunde Adebayo",
    leadPhone: "+234 801 234 5678",
    lastChannel: "whatsapp",
    lastMessagePreview: "Sending now — check your messages!",
    lastMessageTime: "10:46 AM",
    unread: false,
    accent: ACCENTS[0],
    messages: [
      {
        id: "1-1",
        channel: "whatsapp",
        direction: "inbound",
        content: "I'm interested in a 3 bedroom apartment in Victoria Island",
        time: "10:30 AM",
      },
      {
        id: "1-2",
        channel: "whatsapp",
        direction: "outbound",
        content: "Great! I have some amazing options for you.",
        time: "10:31 AM",
        waStatus: "read",
      },
      {
        id: "1-3",
        channel: "note",
        isAiSummary: true,
        content:
          "Lead is looking for a 3-bedroom apartment in Victoria Island, budget ₦150M–₦200M, timeline: immediately.",
        time: "10:32 AM",
      },
      {
        id: "1-4",
        channel: "whatsapp",
        direction: "inbound",
        content: "Can you send me details for VI properties?",
        time: "10:45 AM",
      },
      {
        id: "1-5",
        channel: "whatsapp",
        direction: "outbound",
        content: "Sending now — check your messages!",
        time: "10:46 AM",
        waStatus: "delivered",
      },
    ],
  },
  {
    leadId: "4",
    leadName: "Funke Okoro",
    leadPhone: "+234 804 567 8901",
    lastChannel: "whatsapp",
    lastMessagePreview: "No worries! Let's schedule a call for tomorrow.",
    lastMessageTime: "Yesterday",
    unread: false,
    accent: ACCENTS[4],
    messages: [
      {
        id: "4-1",
        channel: "note",
        content: "Met at open house — interested in studio apartments under ₦40M.",
        time: "3 days ago",
      },
      {
        id: "4-2",
        channel: "call",
        direction: "outbound",
        callOutcome: "no_answer",
        durationSeconds: 0,
        content: "Called to follow up on studio options.",
        time: "2 days ago",
      },
      {
        id: "4-3",
        channel: "whatsapp",
        direction: "inbound",
        content: "Sorry I missed your call! I'm still interested.",
        time: "Yesterday",
      },
      {
        id: "4-4",
        channel: "whatsapp",
        direction: "outbound",
        content: "No worries! Let's schedule a call for tomorrow.",
        time: "Yesterday",
        waStatus: "sent",
      },
    ],
  },
  {
    leadId: "3",
    leadName: "Ibrahim Mohammed",
    leadPhone: "+234 803 456 7890",
    lastChannel: "email",
    lastMessagePreview: "Thanks, looks great. When can I view?",
    lastMessageTime: "Yesterday",
    unread: false,
    accent: ACCENTS[1],
    messages: [
      {
        id: "3-1",
        channel: "email",
        direction: "outbound",
        content: "Sent the property brochure for the 4 Bedroom Duplex, Lekki Phase 1.",
        time: "2 days ago",
      },
      {
        id: "3-2",
        channel: "email",
        direction: "inbound",
        content: "Thanks, looks great. When can I view?",
        time: "Yesterday",
      },
      {
        id: "3-3",
        channel: "note",
        isAiSummary: true,
        content: "Lead confirmed interest via email and is requesting a viewing slot this week.",
        time: "Yesterday",
      },
    ],
  },
  {
    leadId: "2",
    leadName: "Bolanle Adeyemi",
    leadPhone: "+234 802 345 6789",
    lastChannel: "note",
    lastMessagePreview: "Very motivated buyer, pre-approved for mortgage.",
    lastMessageTime: "Yesterday",
    unread: false,
    accent: ACCENTS[3],
    messages: [
      {
        id: "2-1",
        channel: "whatsapp",
        direction: "inbound",
        content: "Hi, is the Lekki Phase 1 apartment still available?",
        time: "Mon, 9:00 AM",
      },
      {
        id: "2-2",
        channel: "whatsapp",
        direction: "outbound",
        content: "Yes it is! Would you like to schedule a viewing?",
        time: "Mon, 9:05 AM",
        waStatus: "read",
      },
      {
        id: "2-3",
        channel: "call",
        direction: "outbound",
        callOutcome: "answered",
        durationSeconds: 185,
        content: "Confirmed viewing for Friday at 11am.",
        time: "Mon, 3:20 PM",
      },
      {
        id: "2-4",
        channel: "note",
        content: "Very motivated buyer, pre-approved for mortgage.",
        time: "Yesterday",
      },
    ],
  },
  {
    leadId: "6",
    leadName: "Emeka Okafor",
    leadPhone: "+234 806 789 0123",
    lastChannel: "whatsapp",
    lastMessagePreview: "Yes! Let's proceed with the offer.",
    lastMessageTime: "6 days ago",
    unread: false,
    accent: ACCENTS[2],
    messages: [
      {
        id: "6-1",
        channel: "call",
        direction: "outbound",
        callOutcome: "voicemail",
        durationSeconds: 0,
        content: "Left voicemail regarding the office suite viewing.",
        time: "1 week ago",
      },
      {
        id: "6-2",
        channel: "whatsapp",
        direction: "outbound",
        content: "Hi Emeka, following up on the office suite at Ikoyi — still interested?",
        time: "1 week ago",
        waStatus: "delivered",
      },
      {
        id: "6-3",
        channel: "whatsapp",
        direction: "inbound",
        content: "Yes! Let's proceed with the offer.",
        time: "6 days ago",
      },
      {
        id: "6-4",
        channel: "note",
        isAiSummary: true,
        content: "Lead is ready to proceed with an offer for the Office Suite (Ikoyi). Suggest creating a deal record.",
        time: "6 days ago",
      },
    ],
  },
];
