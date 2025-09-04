"use client";

interface AdminHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function AdminHeader({
  title,
  description,
  children,
}: AdminHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-neutral-400">{description}</p>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
