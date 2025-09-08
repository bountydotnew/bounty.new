'use client';

type RepoCardProps = {
  name: string;
  fullName?: string;
  private?: boolean;
  stars?: number;
};

export function RepoResultCard({
  name,
  fullName,
  private: isPrivate,
  stars,
}: RepoCardProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800/60 text-[10px] text-neutral-300">
          {isPrivate ? '🔒' : ''}
        </span>
        <div className="truncate">
          <div className="truncate text-neutral-200 text-sm">
            {fullName || name}
          </div>
        </div>
      </div>
      <div className="ml-2 flex items-center gap-1 text-neutral-400 text-xs">
        {typeof stars === 'number' && (
          <>
            <span>⭐</span>
            <span>{stars}</span>
          </>
        )}
      </div>
    </div>
  );
}

type IssueCardProps = {
  number: number;
  title: string;
};

export function IssueResultCard({ number, title }: IssueCardProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800/60 text-[10px] text-neutral-300">
        #{number}
      </span>
      <span className="truncate text-neutral-200">{title}</span>
    </div>
  );
}
