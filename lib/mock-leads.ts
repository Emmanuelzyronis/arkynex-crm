import {
  AtSign,
  CreditCard,
  Globe,
  MessageCircle,
  Pencil,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type LeadStage =
  | "new"
  | "contacted"
  | "viewing_scheduled"
  | "viewed"
  | "negotiating"
  | "offer_made"
  | "closed"
  | "lost";

export type LeadSource =
  | "manual"
  | "whatsapp"
  | "web_widget"
  | "referral"
  | "business_card"
  | "social_dm";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  source: LeadSource;
  stage: LeadStage;
  score: number;
  propertyType: string;
  bedrooms?: number;
  budgetMin: number;
  budgetMax: number;
  area: string;
  lastContact: string | null;
};

export const stageConfig: Record<LeadStage, { label: string; color: string }> = {
  new: { label: "New", color: "#64748B" },
  contacted: { label: "Contacted", color: "#3B82F6" },
  viewing_scheduled: { label: "Viewing Scheduled", color: "#8B5CF6" },
  viewed: { label: "Viewed", color: "#8B5CF6" },
  negotiating: { label: "Negotiating", color: "#F59E0B" },
  offer_made: { label: "Offer Made", color: "#F59E0B" },
  closed: { label: "Closed", color: "#10B981" },
  lost: { label: "Lost", color: "#EF4444" },
};

export const sourceConfig: Record<LeadSource, { label: string; icon: LucideIcon }> = {
  manual: { label: "Manual entry", icon: Pencil },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  web_widget: { label: "Website", icon: Globe },
  referral: { label: "Referral", icon: UserPlus },
  business_card: { label: "Business card", icon: CreditCard },
  social_dm: { label: "Social DM", icon: AtSign },
};

// Filter pills shown above the table. Each maps to one or more underlying
// `stage` values so related statuses (e.g. viewing_scheduled + viewed) can
// share a single tab.
export const leadStageFilters: { value: string; label: string; stages: LeadStage[] }[] = [
  { value: "all", label: "All", stages: [] },
  { value: "new", label: "New", stages: ["new"] },
  { value: "contacted", label: "Contacted", stages: ["contacted"] },
  { value: "viewing", label: "Viewing", stages: ["viewing_scheduled", "viewed"] },
  { value: "negotiating", label: "Negotiating", stages: ["negotiating", "offer_made"] },
  { value: "closed", label: "Closed", stages: ["closed"] },
  { value: "lost", label: "Lost", stages: ["lost"] },
];

export const avatarPalette = [
  "bg-primary/10 text-primary",
  "bg-status-viewing/10 text-status-viewing",
  "bg-status-closed/10 text-status-closed",
  "bg-status-negotiating/10 text-status-negotiating",
  "bg-status-contacted/10 text-status-contacted",
];

export const mockLeads: Lead[] = [
  {
    id: "1",
    name: "Tunde Adebayo",
    phone: "+234 801 234 5678",
    source: "whatsapp",
    stage: "new",
    score: 98,
    propertyType: "Apartment",
    bedrooms: 3,
    budgetMin: 150_000_000,
    budgetMax: 200_000_000,
    area: "Victoria Island",
    lastContact: null,
  },
  {
    id: "2",
    name: "Bolanle Adeyemi",
    phone: "+234 802 345 6789",
    source: "referral",
    stage: "contacted",
    score: 85,
    propertyType: "Apartment",
    bedrooms: 2,
    budgetMin: 80_000_000,
    budgetMax: 110_000_000,
    area: "Lekki Phase 1",
    lastContact: "2h ago",
  },
  {
    id: "3",
    name: "Ibrahim Mohammed",
    phone: "+234 803 456 7890",
    source: "whatsapp",
    stage: "viewing_scheduled",
    score: 72,
    propertyType: "House",
    bedrooms: 4,
    budgetMin: 250_000_000,
    budgetMax: 300_000_000,
    area: "Ikoyi",
    lastContact: "Yesterday",
  },
  {
    id: "4",
    name: "Funke Okoro",
    phone: "+234 804 567 8901",
    source: "web_widget",
    stage: "negotiating",
    score: 60,
    propertyType: "Apartment",
    bedrooms: 2,
    budgetMin: 60_000_000,
    budgetMax: 75_000_000,
    area: "Ajah",
    lastContact: "3 days ago",
  },
  {
    id: "5",
    name: "Chidinma Eze",
    phone: "+234 805 678 9012",
    source: "social_dm",
    stage: "new",
    score: 91,
    propertyType: "House",
    bedrooms: 5,
    budgetMin: 400_000_000,
    budgetMax: 500_000_000,
    area: "Banana Island",
    lastContact: null,
  },
  {
    id: "6",
    name: "Emeka Okafor",
    phone: "+234 806 789 0123",
    source: "referral",
    stage: "viewed",
    score: 68,
    propertyType: "Apartment",
    bedrooms: 3,
    budgetMin: 120_000_000,
    budgetMax: 150_000_000,
    area: "Ikoyi",
    lastContact: "5 days ago",
  },
  {
    id: "7",
    name: "Aisha Bello",
    phone: "+234 807 890 1234",
    source: "manual",
    stage: "offer_made",
    score: 77,
    propertyType: "Land",
    budgetMin: 90_000_000,
    budgetMax: 90_000_000,
    area: "Lekki Phase 1",
    lastContact: "1 week ago",
  },
  {
    id: "8",
    name: "Segun Williams",
    phone: "+234 808 901 2345",
    source: "whatsapp",
    stage: "closed",
    score: 88,
    propertyType: "Apartment",
    bedrooms: 4,
    budgetMin: 180_000_000,
    budgetMax: 220_000_000,
    area: "Victoria Island",
    lastContact: "2 weeks ago",
  },
  {
    id: "9",
    name: "Ngozi Umeh",
    phone: "+234 809 012 3456",
    source: "business_card",
    stage: "lost",
    score: 35,
    propertyType: "Commercial",
    budgetMin: 50_000_000,
    budgetMax: 70_000_000,
    area: "Surulere",
    lastContact: "3 weeks ago",
  },
];

export function formatNaira(amount: number) {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  return `₦${Math.round(amount / 1_000_000)}M`;
}

export function formatBudget(lead: Lead) {
  return lead.budgetMin === lead.budgetMax
    ? formatNaira(lead.budgetMin)
    : `${formatNaira(lead.budgetMin)}–${formatNaira(lead.budgetMax)}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function scoreColor(score: number) {
  if (score >= 80) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}
