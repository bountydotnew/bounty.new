import type React from 'react';
import { SidebarInset, SidebarProvider } from '@bounty/ui/components/sidebar';
import {
  AdminAppSidebar,
} from '@/components/dual-sidebar/app-sidebar';
import { AppSidebar } from '@/components/dual-sidebar/sidebar';
import { MobileLayout } from '@/components/mobile';

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
        <main className="flex-1 min-w-0 min-h-0">
          {admin ? children : <MobileLayout>{children}</MobileLayout>}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export { Sidebar };
