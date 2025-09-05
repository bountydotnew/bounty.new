interface SimpleBountySkeletonProps {
  count?: number;
}

export function SimpleBountySkeleton({ count = 3 }: SimpleBountySkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div className="animate-pulse" key={i}>
          <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
