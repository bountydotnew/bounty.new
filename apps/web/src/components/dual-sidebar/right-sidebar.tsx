import type { ComponentProps } from 'react';
import { Sidebar, SidebarContent, SidebarRail } from '@bounty/ui/components/sidebar';

export function RightSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarRail />
      <SidebarContent>
        <div className="p-4">Hello</div>
      </SidebarContent>
    </Sidebar>
  );
}
