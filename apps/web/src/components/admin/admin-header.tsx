'use client';

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
    <div className="flex items-center justify-between border-neutral-800 border-b pb-4">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">{title}</h1>
        <p className="text-neutral-400 text-sm">{description}</p>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
