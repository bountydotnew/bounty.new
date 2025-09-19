import {
  Sidebar,
  SidebarContent,
  SidebarRail,
} from '@bounty/ui/components/sidebar';
import type { ComponentProps } from 'react';

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
