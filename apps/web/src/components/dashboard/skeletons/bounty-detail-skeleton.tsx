export function BountyDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="h-8 w-20 rounded bg-muted" />
        <div className="h-8 w-28 rounded bg-muted" />
      </div>
      <div className="mb-4 h-8 w-3/4 rounded bg-muted" />
      <div className="mb-6 space-y-3">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="h-16 rounded bg-muted" />
        <div className="h-16 rounded bg-muted" />
        <div className="h-16 rounded bg-muted" />
        <div className="h-16 rounded bg-muted" />
      </div>
      <div className="space-y-4">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-20 rounded bg-muted" />
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-24 rounded bg-muted" />
      </div>
    </div>
  );
}
