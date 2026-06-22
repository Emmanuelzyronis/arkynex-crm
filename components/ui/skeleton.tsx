import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-line/60",
        className,
      )}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-card p-5", className)}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-4 w-8" />
    </div>
  );
}

export function SkeletonGrid({ cols = 3, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-${cols}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-line bg-card">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatsRow() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 56 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-7 w-36" />
      <Skeleton className={`mt-4 w-full rounded-xl`} style={{ height }} />
    </div>
  );
}

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="border-b border-line px-5 py-3">
        <Skeleton className="h-3 w-48" />
      </div>
      <ul className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </ul>
    </div>
  );
}

export function SkeletonKanban({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex w-72 shrink-0 flex-col gap-3">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: i === 0 ? 2 : 1 }).map((_, j) => (
            <div key={j} className="rounded-2xl border border-line bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAgenda({ groups = 2 }: { groups?: number }) {
  return (
    <div className="space-y-8">
      {Array.from({ length: groups }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-16" />
          <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-4 w-16 shrink-0" />
                <div className="flex flex-1 items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
