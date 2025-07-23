import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dual-sidebar/app-sidebar";
import { Header } from "@/components/dual-sidebar/sidebar-header";
// import { RightSidebar } from "@/components/dual-sidebar/right-sidebar";

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider variant="icononly">
      <AppSidebar side="left" />
      <SidebarInset className="h-screen flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
        {children}
        </main>
      </SidebarInset>
      {/* <RightSidebar side="right" /> */}
    </SidebarProvider>
  );
};

export default Sidebar;
