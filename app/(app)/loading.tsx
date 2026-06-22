import {
  SkeletonStatsRow,
  SkeletonChart,
} from "@/components/ui/skeleton";

// This catches all (app) route loading states when no more specific loading.tsx exists.
// Next.js walks up the tree — more specific files like /leads/loading.tsx take precedence.
export default function AppLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="h-7 w-52 animate-pulse rounded-xl bg-line/60" />
        <div className="h-4 w-64 animate-pulse rounded-xl bg-line/60" />
      </div>
      <SkeletonStatsRow />
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart height={224} />
        <SkeletonChart height={224} />
      </div>
    </div>
  );
}
