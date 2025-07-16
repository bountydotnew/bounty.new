import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dual-sidebar/app-sidebar";
import { Header } from "@/components/dual-sidebar/header";
import { RightSidebar } from "@/components/dual-sidebar/right-sidebar";

const Sidebar = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar side="left" />
      <SidebarInset className="h-full overflow-hidden">
        <Header />
        {children}
      </SidebarInset>
      {/* <RightSidebar side="right" /> */}
    </SidebarProvider>
  );
};

export default Sidebar;
