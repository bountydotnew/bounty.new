export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-40 rounded bg-surface-3/20" />
        <div className="h-4 w-64 rounded bg-surface-3/20" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i.toString()} className="rounded-lg border border-border-subtle bg-surface-1 p-6 space-y-4">
            <div className="h-5 w-32 rounded bg-surface-3/20" />
            <div className="h-10 w-full rounded-lg bg-surface-3/20" />
            <div className="h-10 w-full rounded-lg bg-surface-3/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
