import type React from 'react';
import { SidebarInset, SidebarProvider } from '@bounty/ui/components/sidebar';
import {
  AdminAppSidebar,
} from '@/components/dual-sidebar/app-sidebar';
import { AppSidebar } from '@/components/dual-sidebar/sidebar';

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
      <SidebarInset id="sidebar-content" className="flex min-h-screen flex-col bg-dashboard-bg">
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export { Sidebar };
