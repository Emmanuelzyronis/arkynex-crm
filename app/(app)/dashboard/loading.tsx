import {
  SkeletonStatsRow,
  SkeletonChart,
  Skeleton,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <SkeletonStatsRow />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead funnel skeleton */}
        <div className="rounded-2xl border border-line bg-card p-5 lg:p-6">
          <Skeleton className="h-5 w-32" />
          <div className="mt-6 space-y-4">
            {[100, 84, 62, 42, 28].map((w, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-36 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3.5 w-8" />
                </div>
                <div className="h-10 flex-1 overflow-hidden rounded">
                  <div
                    className="h-full animate-pulse rounded bg-line/60"
                    style={{ width: `${w}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <SkeletonChart height={224} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-card p-5 lg:p-6">
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
