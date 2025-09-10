'use client';

import { SidebarTrigger } from "@bounty/ui/components/sidebar";

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
      <div className="flex items-center gap-2">
        <SidebarTrigger
          className="mr-2"
        />
        <h1 className="font-medium text-xl tracking-tight text-neutral-100">{title}</h1>
        <p className="text-neutral-400 text-sm">{description}</p>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
