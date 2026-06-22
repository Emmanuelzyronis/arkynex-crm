import { ACCENTS } from "@/lib/mock-properties";

export type ViewingStatus = "scheduled" | "attended" | "no_show" | "cancelled";
export type ViewingGroup = "Today" | "Tomorrow" | "This Week" | "Past";

export type Viewing = {
  id: string;
  group: ViewingGroup;
  /** Extra date context shown under the time — omitted for Today/Tomorrow
   *  since the section header already says so. */
  dateLabel?: string;
  time: string;
  propertyTitle: string;
  propertyArea: string;
  leadName: string;
  leadPhone: string;
  status: ViewingStatus;
  rating?: number;
  notes?: string;
  accent: string;
};

export const viewingStatusConfig: Record<ViewingStatus, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "#3B82F6" },
  attended: { label: "Attended", color: "#10B981" },
  no_show: { label: "No Show", color: "#EF4444" },
  cancelled: { label: "Cancelled", color: "#64748B" },
};

export const viewingStatusFilters: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "attended", label: "Attended" },
  { value: "no_show", label: "No Show" },
  { value: "cancelled", label: "Cancelled" },
];

export const viewingGroupOrder: ViewingGroup[] = ["Today", "Tomorrow", "This Week", "Past"];

export const mockViewings: Viewing[] = [
  {
    id: "v1",
    group: "Today",
    time: "2:00 PM",
    propertyTitle: "3 Bedroom Apartment",
    propertyArea: "Victoria Island",
    leadName: "Tunde Adebayo",
    leadPhone: "+234 801 234 5678",
    status: "scheduled",
    accent: ACCENTS[0],
  },
  {
    id: "v2",
    group: "Today",
    time: "4:30 PM",
    propertyTitle: "2 Bedroom Flat",
    propertyArea: "Ajah",
    leadName: "Bolanle Adeyemi",
    leadPhone: "+234 802 345 6789",
    status: "scheduled",
    accent: ACCENTS[1],
  },
  {
    id: "v3",
    group: "Tomorrow",
    time: "11:00 AM",
    propertyTitle: "4 Bedroom Duplex",
    propertyArea: "Lekki Phase 1",
    leadName: "Ibrahim Mohammed",
    leadPhone: "+234 803 456 7890",
    status: "scheduled",
    accent: ACCENTS[2],
  },
  {
    id: "v4",
    group: "Tomorrow",
    time: "1:00 PM",
    propertyTitle: "5 Bedroom Detached House",
    propertyArea: "Banana Island",
    leadName: "Chidinma Eze",
    leadPhone: "+234 805 678 9012",
    status: "scheduled",
    accent: ACCENTS[3],
  },
  {
    id: "v5",
    group: "This Week",
    dateLabel: "Wed, Jun 17",
    time: "3:00 PM",
    propertyTitle: "Office Suite, 6th Floor",
    propertyArea: "Ikoyi",
    leadName: "Emeka Okafor",
    leadPhone: "+234 806 789 0123",
    status: "scheduled",
    accent: ACCENTS[4],
  },
  {
    id: "v6",
    group: "This Week",
    dateLabel: "Fri, Jun 19",
    time: "10:00 AM",
    propertyTitle: "Waterfront Land",
    propertyArea: "Banana Island",
    leadName: "Aisha Bello",
    leadPhone: "+234 807 890 1234",
    status: "scheduled",
    accent: ACCENTS[0],
  },
  {
    id: "v7",
    group: "Past",
    dateLabel: "Jun 10",
    time: "2:30 PM",
    propertyTitle: "1 Bedroom Studio",
    propertyArea: "Surulere",
    leadName: "Funke Okoro",
    leadPhone: "+234 804 567 8901",
    status: "attended",
    rating: 4,
    notes: "Loved the natural light. Asked for the floor plan and service charge breakdown.",
    accent: ACCENTS[1],
  },
  {
    id: "v8",
    group: "Past",
    dateLabel: "Jun 8",
    time: "4:00 PM",
    propertyTitle: "4 Bedroom Duplex",
    propertyArea: "Lekki Phase 1",
    leadName: "Segun Williams",
    leadPhone: "+234 808 901 2345",
    status: "attended",
    rating: 5,
    notes: "Very impressed — ready to make an offer this week.",
    accent: ACCENTS[2],
  },
  {
    id: "v9",
    group: "Past",
    dateLabel: "Jun 5",
    time: "11:00 AM",
    propertyTitle: "Commercial Plaza",
    propertyArea: "Yaba",
    leadName: "Ngozi Umeh",
    leadPhone: "+234 809 012 3456",
    status: "no_show",
    notes: "Did not respond to the reminder. Follow up before rebooking.",
    accent: ACCENTS[3],
  },
  {
    id: "v10",
    group: "Past",
    dateLabel: "Jun 2",
    time: "1:00 PM",
    propertyTitle: "3 Bedroom Apartment",
    propertyArea: "Victoria Island",
    leadName: "Tunde Adebayo",
    leadPhone: "+234 801 234 5678",
    status: "cancelled",
    notes: "Rescheduled due to traffic — moved to today's slot.",
    accent: ACCENTS[4],
  },
];
