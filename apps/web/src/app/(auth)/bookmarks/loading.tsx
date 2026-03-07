export default function BookmarksLoading() {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-7 w-32 rounded bg-surface-3/20 animate-pulse" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            className="animate-pulse rounded-lg border border-border-subtle bg-surface-1 p-4"
            key={i.toString()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-surface-3/20" />
                <div className="space-y-1.5">
                  <div className="h-4 w-48 rounded bg-surface-3/20" />
                  <div className="h-3 w-32 rounded bg-surface-3/20" />
                </div>
              </div>
              <div className="h-5 w-16 rounded bg-surface-3/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
