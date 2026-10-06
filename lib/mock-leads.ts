import {
  AtSign,
  Building2,
  CreditCard,
  Globe,
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
  | "web_widget"
  | "referral"
  | "open_house"
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
  web_widget: { label: "Website", icon: Globe },
  referral: { label: "Referral", icon: UserPlus },
  open_house: { label: "Open house", icon: Building2 },
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
    name: "Marcus Bennett",
    phone: "+1 415 234 5678",
    source: "web_widget",
    stage: "new",
    score: 98,
    propertyType: "Apartment",
    bedrooms: 3,
    budgetMin: 450_000,
    budgetMax: 650_000,
    area: "Downtown",
    lastContact: null,
  },
  {
    id: "2",
    name: "Sofia Alvarez",
    phone: "+1 415 345 6789",
    source: "referral",
    stage: "contacted",
    score: 85,
    propertyType: "Apartment",
    bedrooms: 2,
    budgetMin: 320_000,
    budgetMax: 420_000,
    area: "Riverside",
    lastContact: "2h ago",
  },
  {
    id: "3",
    name: "Liam O'Connor",
    phone: "+1 415 456 7890",
    source: "social_dm",
    stage: "viewing_scheduled",
    score: 72,
    propertyType: "House",
    bedrooms: 4,
    budgetMin: 750_000,
    budgetMax: 950_000,
    area: "Chelsea",
    lastContact: "Yesterday",
  },
  {
    id: "4",
    name: "Emily Carter",
    phone: "+1 415 567 8901",
    source: "web_widget",
    stage: "negotiating",
    score: 60,
    propertyType: "Apartment",
    bedrooms: 2,
    budgetMin: 275_000,
    budgetMax: 340_000,
    area: "Greenwood",
    lastContact: "3 days ago",
  },
  {
    id: "5",
    name: "Priya Nair",
    phone: "+1 415 678 9012",
    source: "social_dm",
    stage: "new",
    score: 91,
    propertyType: "House",
    bedrooms: 5,
    budgetMin: 1_200_000,
    budgetMax: 1_600_000,
    area: "Harbor Island",
    lastContact: null,
  },
  {
    id: "6",
    name: "Daniel Reyes",
    phone: "+1 415 789 0123",
    source: "referral",
    stage: "viewed",
    score: 68,
    propertyType: "Apartment",
    bedrooms: 3,
    budgetMin: 420_000,
    budgetMax: 520_000,
    area: "Chelsea",
    lastContact: "5 days ago",
  },
  {
    id: "7",
    name: "Aisha Rahman",
    phone: "+1 415 890 1234",
    source: "manual",
    stage: "offer_made",
    score: 77,
    propertyType: "Land",
    budgetMin: 210_000,
    budgetMax: 210_000,
    area: "Riverside",
    lastContact: "1 week ago",
  },
  {
    id: "8",
    name: "Sean Whitfield",
    phone: "+1 415 901 2345",
    source: "open_house",
    stage: "closed",
    score: 88,
    propertyType: "Apartment",
    bedrooms: 4,
    budgetMin: 600_000,
    budgetMax: 780_000,
    area: "Downtown",
    lastContact: "2 weeks ago",
  },
  {
    id: "9",
    name: "Grace Kim",
    phone: "+1 415 012 3456",
    source: "business_card",
    stage: "lost",
    score: 35,
    propertyType: "Commercial",
    budgetMin: 180_000,
    budgetMax: 260_000,
    area: "Maplewood",
    lastContact: "3 weeks ago",
  },
];

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
