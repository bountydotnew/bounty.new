export function BountyDetailSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-background pt-16 text-foreground">
      <div className="mx-auto max-w-[90%]">
        <div className="mb-4 flex w-full items-center justify-between">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="h-6 w-32 rounded bg-surface-3/20" />
            <div className="h-8 w-24 rounded bg-surface-3/20" />
          </div>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="p-8">
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-10 w-3/4 rounded bg-surface-3/20" />
                <div className="h-8 w-24 rounded bg-surface-3/20" />
              </div>

              <div className="flex w-full flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-surface-3/20" />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 rounded bg-surface-3/20" />
                      <div className="h-4 w-4 rounded bg-surface-3/20" />
                    </div>
                  </div>
                </div>

                <div className="flex w-full items-center justify-end gap-2">
                  <div className="h-8 w-8 rounded bg-surface-3/20" />
                  <div className="h-8 w-8 rounded bg-surface-3/20" />
                  <div className="h-8 w-8 rounded bg-surface-3/20" />
                  <div className="h-8 w-8 rounded bg-surface-3/20" />
                </div>
              </div>
            </div>

            {/* About section */}
            <div className="mb-8 rounded-lg border border-border-strong/20 bg-surface-1 p-6">
              <div className="mb-4 h-6 w-16 rounded bg-surface-3/20" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-surface-3/20" />
                <div className="h-4 w-5/6 rounded bg-surface-3/20" />
                <div className="h-4 w-4/5 rounded bg-surface-3/20" />
                <div className="h-4 w-3/4 rounded bg-surface-3/20" />
              </div>
            </div>

            {/* Submissions section */}
            <div className="mb-8 rounded-lg p-6">
              <div className="mb-4 h-6 w-24 rounded bg-surface-3/20" />
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-1 p-4">
                  <div className="h-10 w-10 rounded-full bg-surface-3/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-surface-3/20" />
                    <div className="h-4 w-full rounded bg-surface-3/20" />
                    <div className="h-4 w-3/4 rounded bg-surface-3/20" />
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-1 p-4">
                  <div className="h-10 w-10 rounded-full bg-surface-3/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 rounded bg-surface-3/20" />
                    <div className="h-4 w-full rounded bg-surface-3/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
