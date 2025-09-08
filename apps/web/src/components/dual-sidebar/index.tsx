import {
  AdminAppSidebar,
  AppSidebar,
} from '@/components/dual-sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@bounty/ui/components/sidebar';

// import { Header } from "@/components/dual-sidebar/sidebar-header";
// import { RightSidebar } from "@/components/dual-sidebar/right-sidebar";

const Sidebar = ({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) => {
  return (
    <SidebarProvider variant="icononly">
      {admin ? <AdminAppSidebar side="left" /> : <AppSidebar side="left" />}
      <SidebarInset className="flex h-screen flex-col">
        {/* <Header /> */}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export { Sidebar, AppSidebar, AdminAppSidebar };
