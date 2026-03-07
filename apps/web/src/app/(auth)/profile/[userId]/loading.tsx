export default function ProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 md:py-12 animate-pulse">
      <div className="flex flex-col gap-8">
        {/* Header skeleton */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
              <div className="h-24 w-24 rounded-xl bg-white/5 md:h-32 md:w-32" />
              <div className="flex flex-col gap-2 pt-1">
                <div className="h-8 w-48 rounded bg-white/5" />
                <div className="h-4 w-32 rounded bg-white/5" />
                <div className="h-4 w-64 rounded bg-white/5" />
                <div className="flex gap-4 pt-1">
                  <div className="h-4 w-28 rounded bg-white/5" />
                  <div className="h-4 w-20 rounded bg-white/5" />
                </div>
              </div>
            </div>
          </div>
          <div className="h-24 w-full rounded-xl bg-white/5" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-4 border-b border-border-subtle pb-2">
          <div className="h-8 w-20 rounded bg-white/5" />
          <div className="h-8 w-20 rounded bg-white/5" />
          <div className="h-8 w-20 rounded bg-white/5" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-24 w-full rounded-xl bg-white/5" />
          <div className="h-24 w-full rounded-xl bg-white/5" />
          <div className="h-24 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
