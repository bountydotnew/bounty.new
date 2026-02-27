'use client';

/**
 * Minimal skeleton for Linear integration pages.
 * Used as a loading fallback in Suspense boundaries.
 */
export function LinearSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/5" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-white/5" />
          <div className="h-3 w-24 rounded bg-white/5" />
        </div>
      </div>
      <div className="space-y-3">
        {['header', 'content', 'footer'].map((section) => (
          <div
            key={`linear-skeleton-${section}`}
            className="h-16 rounded-xl bg-white/5"
          />
        ))}
      </div>
    </div>
  );
}
