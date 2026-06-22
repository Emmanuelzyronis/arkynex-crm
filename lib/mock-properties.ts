import type { Kind } from "@/components/landing/building-illustration";

export type PropertyType = "apartment" | "house" | "land" | "commercial" | "office";
export type PropertyStatus = "active" | "under_offer" | "sold" | "withdrawn";

export type Property = {
  id: string;
  title: string;
  area: string;
  city: string;
  price: number;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  status: PropertyStatus;
  inquiryCount: number;
  viewingCount: number;
  accent: string;
};

export const statusConfig: Record<PropertyStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "#10B981" },
  under_offer: { label: "Under Offer", color: "#F59E0B" },
  sold: { label: "Sold", color: "#64748B" },
  withdrawn: { label: "Withdrawn", color: "#EF4444" },
};

export const propertyStatusFilters: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "under_offer", label: "Under Offer" },
  { value: "sold", label: "Sold" },
  { value: "withdrawn", label: "Withdrawn" },
];

export const propertyTypeFilters: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "land", label: "Land" },
  { value: "commercial", label: "Commercial" },
  { value: "office", label: "Office" },
];

// Cycled across cards purely for visual variety in the illustrations.
export const ACCENTS = ["#5B5FEF", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"];

export const mockProperties: Property[] = [
  {
    id: "p1",
    title: "4 Bedroom Duplex",
    area: "Lekki Phase 1",
    city: "Lagos",
    price: 250_000_000,
    propertyType: "house",
    bedrooms: 4,
    bathrooms: 5,
    sizeSqm: 300,
    status: "active",
    inquiryCount: 18,
    viewingCount: 6,
    accent: ACCENTS[0],
  },
  {
    id: "p2",
    title: "3 Bedroom Apartment",
    area: "Victoria Island",
    city: "Lagos",
    price: 180_000_000,
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 4,
    sizeSqm: 210,
    status: "under_offer",
    inquiryCount: 24,
    viewingCount: 9,
    accent: ACCENTS[1],
  },
  {
    id: "p3",
    title: "Waterfront Land",
    area: "Banana Island",
    city: "Lagos",
    price: 950_000_000,
    propertyType: "land",
    sizeSqm: 1200,
    status: "active",
    inquiryCount: 7,
    viewingCount: 2,
    accent: ACCENTS[2],
  },
  {
    id: "p4",
    title: "Office Suite, 6th Floor",
    area: "Ikoyi",
    city: "Lagos",
    price: 320_000_000,
    propertyType: "office",
    bathrooms: 2,
    sizeSqm: 180,
    status: "active",
    inquiryCount: 5,
    viewingCount: 1,
    accent: ACCENTS[3],
  },
  {
    id: "p5",
    title: "2 Bedroom Flat",
    area: "Ajah",
    city: "Lagos",
    price: 65_000_000,
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    sizeSqm: 95,
    status: "sold",
    inquiryCount: 31,
    viewingCount: 12,
    accent: ACCENTS[4],
  },
  {
    id: "p6",
    title: "5 Bedroom Detached House",
    area: "Banana Island",
    city: "Lagos",
    price: 600_000_000,
    propertyType: "house",
    bedrooms: 5,
    bathrooms: 6,
    sizeSqm: 480,
    status: "active",
    inquiryCount: 14,
    viewingCount: 4,
    accent: ACCENTS[0],
  },
  {
    id: "p7",
    title: "Commercial Plaza",
    area: "Yaba",
    city: "Lagos",
    price: 420_000_000,
    propertyType: "commercial",
    sizeSqm: 650,
    status: "withdrawn",
    inquiryCount: 3,
    viewingCount: 0,
    accent: ACCENTS[1],
  },
  {
    id: "p8",
    title: "Mixed-Use Land",
    area: "Epe",
    city: "Lagos",
    price: 85_000_000,
    propertyType: "land",
    sizeSqm: 2000,
    status: "active",
    inquiryCount: 9,
    viewingCount: 3,
    accent: ACCENTS[2],
  },
  {
    id: "p9",
    title: "1 Bedroom Studio",
    area: "Surulere",
    city: "Lagos",
    price: 38_000_000,
    propertyType: "apartment",
    bedrooms: 1,
    bathrooms: 1,
    sizeSqm: 48,
    status: "active",
    inquiryCount: 11,
    viewingCount: 5,
    accent: ACCENTS[3],
  },
];

/** Maps a DB property_type to the matching BuildingIllustration variant. */
export function illustrationKind(type: PropertyType): Kind {
  if (type === "land") return "land";
  if (type === "commercial" || type === "office") return "commercial";
  return "residential";
}
