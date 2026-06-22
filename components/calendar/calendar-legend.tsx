import { viewingStatusConfig } from "@/lib/mock-viewings";

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
      {Object.values(viewingStatusConfig).map((config) => (
        <span key={config.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: config.color }} />
          {config.label}
        </span>
      ))}
    </div>
  );
}
