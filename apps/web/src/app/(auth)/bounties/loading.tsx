import { BountySkeleton } from '@/components/dashboard/skeletons/bounty-skeleton';

export default function BountiesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters skeleton */}
      <div className="mb-6 flex flex-wrap items-center gap-3 animate-pulse">
        <div className="h-10 w-64 rounded-lg bg-surface-3/20" />
        <div className="h-10 w-[150px] rounded-lg bg-surface-3/20" />
        <div className="h-10 w-[150px] rounded-lg bg-surface-3/20" />
      </div>

      {/* Grid skeleton */}
      <BountySkeleton count={6} grid />
    </div>
  );
}
