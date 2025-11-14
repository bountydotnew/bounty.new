import type React from 'react';
import { SidebarInset, SidebarProvider } from '@bounty/ui/components/sidebar';
import {
  AdminAppSidebar,
  AppSidebar,
} from '@/components/dual-sidebar/app-sidebar';

const Sidebar = ({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) => {
  return (
    <SidebarProvider variant="sidebar">
      {admin ? <AdminAppSidebar side="left" /> : <AppSidebar side="left" />}
      <SidebarInset className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]">
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export { Sidebar };
