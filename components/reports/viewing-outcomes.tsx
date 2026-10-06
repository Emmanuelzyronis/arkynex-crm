import type { ReportViewingOutcome } from "@/lib/db/queries/reports";

export function ViewingOutcomes({ data }: { data: ReportViewingOutcome[] }) {
  const max = Math.max(...data.map((o) => o.count), 1);
  const total = data.reduce((sum, o) => sum + o.count, 0);
  const isEmpty = total === 0;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 lg:p-6">
      <h2 className="text-base font-semibold text-ink">Viewing Outcomes</h2>
      <p className="mt-1 text-sm text-ink-muted">{isEmpty ? "No viewings yet" : `${total} viewings this period`}</p>

      {isEmpty ? (
        <div className="mt-4 flex items-center justify-center py-8">
          <p className="text-sm text-ink-muted">No viewings recorded yet.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {data.map((item) => (
            <div key={item.outcome}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{item.outcome}</span>
                <span className="text-ink-muted">{item.count}</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-surface">
                <div className="h-2 rounded-full" style={{ width: `${(item.count / max) * 100}%`, backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
