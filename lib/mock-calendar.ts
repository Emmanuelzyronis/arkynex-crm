import { mockViewings, viewingStatusConfig } from "@/lib/mock-viewings";

export type CalendarCell = { day: number; month: "prev" | "current" | "next" };

// June 1, 2026 is a Monday, so the Sun-start grid begins on May 31 and ends
// on Jul 4 (5 full weeks / 35 cells).
export const calendarCells: CalendarCell[] = [
  { day: 31, month: "prev" },
  ...Array.from({ length: 30 }, (_, i) => ({ day: i + 1, month: "current" as const })),
  ...Array.from({ length: 4 }, (_, i) => ({ day: i + 1, month: "next" as const })),
];

export const TODAY = 14;

export type CalendarEvent = {
  id: string;
  day: number;
  time: string;
  leadName: string;
  color: string;
};

// Maps mock viewings onto specific days of June for the grid demo.
const dayForViewing: Record<string, number> = {
  v10: 2,
  v9: 5,
  v8: 8,
  v7: 10,
  v1: 14,
  v2: 14,
  v3: 15,
  v4: 15,
  v5: 17,
  v6: 19,
};

export const calendarEvents: CalendarEvent[] = mockViewings
  .filter((v) => dayForViewing[v.id] != null)
  .map((v) => ({
    id: v.id,
    day: dayForViewing[v.id],
    time: v.time,
    leadName: v.leadName.split(" ")[0],
    color: viewingStatusConfig[v.status].color,
  }));

export function eventsForDay(day: number) {
  return calendarEvents.filter((event) => event.day === day);
}
