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
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          : "space-y-4"
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex w-full flex-col items-start gap-3 rounded-lg bg-[#1D1D1D] p-6 border border-[#383838]/20">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-[#383838] rounded-full"></div>
                <div className="flex flex-col gap-1">
                  <div className="h-4 bg-[#383838] rounded w-20"></div>
                  <div className="h-3 bg-[#383838] rounded w-16"></div>
                </div>
              </div>
              <div className="h-6 bg-[#383838] rounded w-16"></div>
            </div>

            <div className="w-full space-y-2">
              <div className="h-5 bg-[#383838] rounded w-3/4"></div>
              <div className="h-4 bg-[#383838] rounded w-full"></div>
              <div className="h-4 bg-[#383838] rounded w-2/3"></div>
            </div>

            <div className="h-4 bg-[#383838] rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
