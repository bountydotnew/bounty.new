import type React from 'react';
import { SidebarInset, SidebarProvider } from '@bounty/ui/components/sidebar';
import {
  AppSidebar,
} from '@/components/settings/sidebar/app-sidebar';

const Sidebar = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SidebarProvider variant="sidebar">
      <AppSidebar side="left" />
      <SidebarInset className="flex min-h-screen flex-col bg-dashboard-bg">
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export { Sidebar };
