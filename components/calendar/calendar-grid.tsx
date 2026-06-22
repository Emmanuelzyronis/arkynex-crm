import { TODAY, calendarCells, eventsForDay } from "@/lib/mock-calendar";
import { cn } from "@/lib/utils";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="grid grid-cols-7 border-b border-line">
        {weekdays.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-muted"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarCells.map((cell, i) => {
          const isToday = cell.month === "current" && cell.day === TODAY;
          const events = cell.month === "current" ? eventsForDay(cell.day) : [];

          return (
            <div
              key={i}
              className={cn(
                "min-h-[88px] border-b border-r border-line p-1.5 sm:min-h-[112px] sm:p-2",
                i % 7 === 6 && "border-r-0",
                i >= 28 && "border-b-0",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday
                    ? "bg-primary text-white"
                    : cell.month === "current"
                      ? "text-ink"
                      : "text-ink-muted/50",
                )}
              >
                {cell.day}
              </span>

              {events.length > 0 && (
                <div className="mt-1.5 flex gap-1 sm:hidden">
                  {events.slice(0, 4).map((event) => (
                    <span
                      key={event.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                  ))}
                </div>
              )}

              <div className="mt-1.5 hidden flex-col gap-1 sm:flex">
                {events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    title={`${event.time} — ${event.leadName}`}
                    className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: `${event.color}1A`, color: event.color }}
                  >
                    {event.time} {event.leadName}
                  </div>
                ))}
                {events.length > 3 && (
                  <span className="px-1.5 text-[10px] text-ink-muted">
                    +{events.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
