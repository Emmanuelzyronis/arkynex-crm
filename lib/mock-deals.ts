import { ACCENTS } from "@/lib/mock-properties";

export type DealStatus =
  | "negotiating"
  | "offer_accepted"
  | "docs_processing"
  | "completed"
  | "fallen_through";

export type Deal = {
  id: string;
  propertyTitle: string;
  propertyArea: string;
  leadName: string;
  askingPrice: number;
  agreedPrice?: number;
  commissionAmount?: number;
  /** 0–1, mirrors deals.closing_probability */
  closingProbability: number;
  /** Short label, e.g. "Jun 28" */
  closeDate: string;
  status: DealStatus;
  notes?: string;
  accent: string;
};

export const dealStatusConfig: Record<DealStatus, { label: string; color: string }> = {
  negotiating: { label: "Negotiating", color: "#F59E0B" },
  offer_accepted: { label: "Offer Accepted", color: "#3B82F6" },
  docs_processing: { label: "Docs Processing", color: "#8B5CF6" },
  completed: { label: "Completed", color: "#10B981" },
  fallen_through: { label: "Fallen Through", color: "#EF4444" },
};

export const dealColumnOrder: DealStatus[] = [
  "negotiating",
  "offer_accepted",
  "docs_processing",
  "completed",
  "fallen_through",
];

export const mockDeals: Deal[] = [
  {
    id: "d1",
    propertyTitle: "3 Bedroom Apartment",
    propertyArea: "Victoria Island",
    leadName: "Tunde Adebayo",
    askingPrice: 200_000_000,
    closingProbability: 0.45,
    closeDate: "Jun 28",
    status: "negotiating",
    accent: ACCENTS[0],
  },
  {
    id: "d2",
    propertyTitle: "Waterfront Land",
    propertyArea: "Banana Island",
    leadName: "Aisha Bello",
    askingPrice: 950_000_000,
    closingProbability: 0.3,
    closeDate: "Jul 10",
    status: "negotiating",
    accent: ACCENTS[2],
  },
  {
    id: "d3",
    propertyTitle: "4 Bedroom Duplex",
    propertyArea: "Lekki Phase 1",
    leadName: "Ibrahim Mohammed",
    askingPrice: 250_000_000,
    agreedPrice: 235_000_000,
    commissionAmount: 11_750_000,
    closingProbability: 0.7,
    closeDate: "Jun 24",
    status: "offer_accepted",
    accent: ACCENTS[1],
  },
  {
    id: "d4",
    propertyTitle: "5 Bedroom Detached House",
    propertyArea: "Banana Island",
    leadName: "Chidinma Eze",
    askingPrice: 600_000_000,
    agreedPrice: 580_000_000,
    commissionAmount: 29_000_000,
    closingProbability: 0.65,
    closeDate: "Jul 5",
    status: "offer_accepted",
    accent: ACCENTS[3],
  },
  {
    id: "d5",
    propertyTitle: "4 Bedroom Duplex",
    propertyArea: "Lekki Phase 1",
    leadName: "Segun Williams",
    askingPrice: 220_000_000,
    agreedPrice: 210_000_000,
    commissionAmount: 10_500_000,
    closingProbability: 0.85,
    closeDate: "Jun 20",
    status: "docs_processing",
    accent: ACCENTS[4],
  },
  {
    id: "d6",
    propertyTitle: "2 Bedroom Flat",
    propertyArea: "Ajah",
    leadName: "Bolanle Adeyemi",
    askingPrice: 75_000_000,
    agreedPrice: 70_000_000,
    commissionAmount: 3_500_000,
    closingProbability: 0.8,
    closeDate: "Jun 22",
    status: "docs_processing",
    accent: ACCENTS[0],
  },
  {
    id: "d7",
    propertyTitle: "1 Bedroom Studio",
    propertyArea: "Surulere",
    leadName: "Funke Okoro",
    askingPrice: 38_000_000,
    agreedPrice: 36_000_000,
    commissionAmount: 1_800_000,
    closingProbability: 1,
    closeDate: "Jun 5",
    status: "completed",
    accent: ACCENTS[1],
  },
  {
    id: "d8",
    propertyTitle: "Office Suite, 6th Floor",
    propertyArea: "Ikoyi",
    leadName: "Emeka Okafor",
    askingPrice: 320_000_000,
    agreedPrice: 310_000_000,
    commissionAmount: 15_500_000,
    closingProbability: 1,
    closeDate: "May 28",
    status: "completed",
    accent: ACCENTS[2],
  },
  {
    id: "d9",
    propertyTitle: "Commercial Plaza",
    propertyArea: "Yaba",
    leadName: "Ngozi Umeh",
    askingPrice: 420_000_000,
    closingProbability: 0,
    closeDate: "Jun 18",
    status: "fallen_through",
    notes: "Buyer withdrew financing — relisting property.",
    accent: ACCENTS[3],
  },
];

export function probabilityColor(p: number) {
  if (p >= 0.7) return "#10B981";
  if (p >= 0.4) return "#F59E0B";
  return "#EF4444";
}

export function closeDateLabel(deal: Deal) {
  if (deal.status === "completed" || deal.status === "fallen_through") {
    return `Closed ${deal.closeDate}`;
  }
  return `Expected ${deal.closeDate}`;
}
