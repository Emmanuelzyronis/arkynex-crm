import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getViewings } from "@/lib/supabase/queries/viewings";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#3B82F6",
  attended: "#10B981",
  no_show: "#EF4444",
  cancelled: "#64748B",
};

function buildCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { day: number; month: "prev" | "current" | "next" }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: "prev" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: "current" });
  }
  const remaining = 42 - cells.length; // always 6 rows
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: "next" });
  }
  return cells;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { year: yearParam, month: monthParam } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const year = parseInt(yearParam ?? String(now.getFullYear()));
  const month = parseInt(monthParam ?? String(now.getMonth())); // 0-indexed

  const cells = buildCalendarCells(year, month);
  const viewings = await getViewings(supabase);

  // Map each viewing to a day number in the current month
  const eventsByDay: Record<number, { time: string; title: string; color: string }[]> = {};
  for (const v of viewings) {
    const d = new Date(v.scheduled_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      const property = v.properties as { title: string; area: string | null } | null;
      eventsByDay[day].push({
        time: d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" }),
        title: (v.leads as { full_name: string } | null)?.full_name ?? "Lead",
        color: STATUS_COLORS[v.status] ?? "#64748B",
      });
    }
  }

  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // Prev / next month links
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const monthLabel = new Date(year, month).toLocaleDateString("en-NG", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Calendar</h1>
          <p className="mt-1 text-sm text-ink-muted">Viewings and scheduled activity</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/calendar?year=${prevYear}&month=${prevMonth}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </a>
          <span className="text-sm font-semibold text-ink">{monthLabel}</span>
          <a
            href={`/calendar?year=${nextYear}&month=${nextMonth}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, i) => {
            const isToday = isCurrentMonth && cell.month === "current" && cell.day === today;
            const events = cell.month === "current" ? (eventsByDay[cell.day] ?? []) : [];
            const isLastRow = i >= cells.length - 7;
            const isLastCol = (i + 1) % 7 === 0;

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[88px] p-1.5 sm:min-h-[112px] sm:p-2",
                  !isLastRow && "border-b border-line",
                  !isLastCol && "border-r border-line",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday ? "bg-primary text-white" : cell.month === "current" ? "text-ink" : "text-ink-muted/40",
                  )}
                >
                  {cell.day}
                </span>

                {/* Mobile: dots */}
                {events.length > 0 && (
                  <div className="mt-1.5 flex gap-1 sm:hidden">
                    {events.slice(0, 4).map((event, j) => (
                      <span key={j} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: event.color }} />
                    ))}
                  </div>
                )}

                {/* Desktop: chips */}
                <div className="mt-1.5 hidden flex-col gap-1 sm:flex">
                  {events.slice(0, 3).map((event, j) => (
                    <div
                      key={j}
                      className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: `${event.color}1A`, color: event.color }}
                      title={`${event.time} — ${event.title}`}
                    >
                      {event.time} {event.title}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <span className="px-1.5 text-[10px] text-ink-muted">+{events.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{status.replace("_", " ")}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
