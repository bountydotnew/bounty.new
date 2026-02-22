'use client';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-border-subtle border-dashed bg-surface-1/50">
      <p className="text-sm text-text-tertiary">{message}</p>
    </div>
  );
}
