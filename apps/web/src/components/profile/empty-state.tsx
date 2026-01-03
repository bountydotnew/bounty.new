'use client';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-[#232323] border-dashed bg-[#191919]/50">
      <p className="text-sm text-[#5A5A5A]">{message}</p>
    </div>
  );
}
