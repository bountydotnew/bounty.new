export default function DiscordLoading() {
  return (
    <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="relative flex flex-col pb-10 px-4 w-full min-w-0 animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-surface-3/20" />
            <div className="space-y-1.5">
              <div className="h-6 w-40 rounded bg-surface-3/20" />
              <div className="h-3 w-56 rounded bg-surface-3/20" />
            </div>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface-1 p-6 space-y-4">
            <div className="h-5 w-32 rounded bg-surface-3/20" />
            <div className="h-4 w-full rounded bg-surface-3/20" />
            <div className="h-10 w-40 rounded-lg bg-surface-3/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
