import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="grid grid-cols-7 border-b border-line p-3 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 mx-auto w-8" />
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[88px] border-b border-r border-line p-2 last:border-r-0 sm:min-h-[112px]"
            >
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
