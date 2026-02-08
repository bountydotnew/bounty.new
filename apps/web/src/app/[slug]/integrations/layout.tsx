'use client';

import { Header } from '@/components/dual-sidebar/sidebar-header';

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background min-w-0 overflow-x-hidden">
        {/* Horizontal border line above content */}
        <div className="h-px w-full shrink-0 bg-surface-3" />
        {children}
      </div>
    </>
  );
}
