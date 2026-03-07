export default function IntegrationsLoading() {
  return (
    <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="relative flex flex-col pb-10 px-4 w-full min-w-0 space-y-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-8 w-48 rounded bg-surface-3/20" />
            <div className="h-4 w-80 rounded bg-surface-3/20" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i.toString()} className="rounded-lg border border-border-subtle bg-surface-1 p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-surface-3/20" />
                  <div className="space-y-1.5">
                    <div className="h-5 w-24 rounded bg-surface-3/20" />
                    <div className="h-3 w-40 rounded bg-surface-3/20" />
                  </div>
                </div>
                <div className="h-9 w-full rounded-lg bg-surface-3/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
