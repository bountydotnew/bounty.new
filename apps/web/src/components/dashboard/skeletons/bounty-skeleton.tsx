interface BountySkeletonProps {
  count?: number;
  grid?: boolean;
}

export function BountySkeleton({
  count = 1,
  grid = false,
}: BountySkeletonProps) {
  return (
    <div
      className={
        grid
          ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
          : 'space-y-4'
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <div className="animate-pulse" key={i}>
          <div className="flex w-full flex-col items-start gap-3 rounded-lg border border-[#383838]/20 bg-[#1D1D1D] p-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-[#383838]" />
                <div className="flex flex-col gap-1">
                  <div className="h-4 w-20 rounded bg-[#383838]" />
                  <div className="h-3 w-16 rounded bg-[#383838]" />
                </div>
              </div>
              <div className="h-6 w-16 rounded bg-[#383838]" />
            </div>

            <div className="w-full space-y-2">
              <div className="h-5 w-3/4 rounded bg-[#383838]" />
              <div className="h-4 w-full rounded bg-[#383838]" />
              <div className="h-4 w-2/3 rounded bg-[#383838]" />
            </div>

            <div className="h-4 w-24 rounded bg-[#383838]" />
          </div>
        </div>
      ))}
    </div>
  );
}
