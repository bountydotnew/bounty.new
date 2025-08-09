"use client";

type RepoCardProps = {
  name: string;
  fullName?: string;
  private?: boolean;
  stars?: number;
};

export function RepoResultCard({ name, fullName, private: isPrivate, stars }: RepoCardProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border text-[10px]">{isPrivate ? "🔒" : ""}</span>
        <div className="truncate">
          <div className="truncate text-sm">{fullName || name}</div>
        </div>
      </div>
      <div className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
        {typeof stars === "number" && (
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
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border text-[10px]">#{number}</span>
      <span className="truncate">{title}</span>
    </div>
  );
}


