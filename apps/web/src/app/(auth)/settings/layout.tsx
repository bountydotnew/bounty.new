import type { Metadata } from 'next';
import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { Header } from '@/components/dual-sidebar/sidebar-header';

export const metadata: Metadata = {
  title: 'Settings - bounty.new',
  description: 'Manage your account settings and preferences',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      {/* Header with bottom border */}
      <div className="border-border border-b">
        <Header />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar with right border */}
        <div className="border-border border-r">
          <SettingsSidebar />
        </div>

        {/* Main Content with left border for visual separation */}
        <div className="relative flex-1 overflow-y-auto border-border border-l">
          {/* Vertical line on the left edge */}
          <div className="absolute inset-y-0 left-0 w-px bg-border" />

          {/* Content */}
          <div className="h-full">
            {children}
          </div>

          {/* Vertical line on the right edge */}
          <div className="absolute inset-y-0 right-0 w-px bg-border" />
        </div>
      </div>
    </div>
  );
}
