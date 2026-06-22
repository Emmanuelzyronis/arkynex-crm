import type { FunnelStage } from "@/lib/supabase/queries/dashboard";

const VIEW_WIDTH = 400;
const LABEL_AREA_END = 140;
const FUNNEL_CENTER = (LABEL_AREA_END + VIEW_WIDTH) / 2;
const TOP_WIDTH = 250;
const BOTTOM_WIDTH = 50;
const SEGMENT_HEIGHT = 42;
const GAP = 8;

export function LeadFunnel({ stages }: { stages: FunnelStage[] }) {
  const n = stages.length;
  const widthStep = (TOP_WIDTH - BOTTOM_WIDTH) / n;
  const widths = Array.from({ length: n + 1 }, (_, i) => TOP_WIDTH - i * widthStep);
  const xLeft = (w: number) => FUNNEL_CENTER - w / 2;
  const viewHeight = n * SEGMENT_HEIGHT + (n - 1) * GAP;

  const isEmpty = stages.every((s) => s.count === 0);

  return (
    <div className="rounded-2xl border border-line bg-card p-5 lg:p-6">
      <h2 className="text-base font-semibold text-ink">Lead Pipeline</h2>

      {isEmpty ? (
        <div className="mt-6 flex items-center justify-center py-8">
          <p className="text-sm text-ink-muted">No leads yet — add your first lead to see the pipeline.</p>
        </div>
      ) : (
        <div className="relative mt-6" style={{ height: viewHeight }}>
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {stages.map((stage, i) => {
              const y0 = i * (SEGMENT_HEIGHT + GAP);
              const y1 = y0 + SEGMENT_HEIGHT;
              const w0 = widths[i];
              const w1 = widths[i + 1];
              const points = [
                `${xLeft(w0)},${y0}`,
                `${xLeft(w0) + w0},${y0}`,
                `${xLeft(w1) + w1},${y1}`,
                `${xLeft(w1)},${y1}`,
              ].join(" ");
              return <polygon key={stage.stage} points={points} fill={stage.color} />;
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col gap-2">
            {stages.map((stage) => (
              <div key={stage.stage} className="flex flex-1 flex-col justify-center pl-4">
                <p className="text-xs font-medium text-ink-muted">{stage.label}</p>
                <p className="text-sm font-semibold text-ink">{stage.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
