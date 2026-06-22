import { Skeleton, SkeletonChart, SkeletonTable } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-28" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-card p-5 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <SkeletonChart height={288} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart height={200} />
        <SkeletonChart height={200} />
      </div>
      <SkeletonTable rows={5} />
    </div>
  );
}
