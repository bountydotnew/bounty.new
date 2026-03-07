export default function GitHubInstallationLoading() {
  return (
    <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="relative flex flex-col pb-10 px-4 w-full min-w-0 animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-surface-3/20" />
              <div className="space-y-1.5">
                <div className="h-5 w-36 rounded bg-surface-3/20" />
                <div className="h-3 w-24 rounded bg-surface-3/20" />
              </div>
            </div>
            <div className="h-9 w-28 rounded-lg bg-surface-3/20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i.toString()} className="rounded-lg border border-border-subtle bg-surface-1 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded bg-surface-3/20" />
                  <div className="h-4 w-48 rounded bg-surface-3/20" />
                </div>
                <div className="h-3 w-16 rounded bg-surface-3/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
