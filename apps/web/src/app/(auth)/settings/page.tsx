'use client';

import { Bell, CreditCard, DollarSign, Shield, User } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/components/tabs';
import { BillingSettings } from '@/components/settings/billing-settings';
import { GeneralSettings } from '@/components/settings/general-settings';
import { PaymentSettings } from '@/components/settings/payment-settings';
import { SecuritySettings } from '@/components/settings/security-settings';

// TypeScript interfaces for better type safety
interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  disabled?: boolean;
  comingSoon?: boolean;
}

// Tab configuration for maintainability
const TAB_CONFIGS: TabConfig[] = [
  {
    id: 'general',
    label: 'General',
    icon: User,
    component: GeneralSettings,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    component: BillingSettings,
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: DollarSign,
    component: PaymentSettings,
  },
  {
    id: 'security',
    label: 'Security',
    icon: Shield,
    component: SecuritySettings,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    component: () => (
      <div className="rounded-lg border border-border border-dashed bg-card p-6">
        <div className="mb-2 flex items-center gap-2">
          <Bell className="h-5 w-5 text-foreground" />
          <h3 className="font-medium text-foreground">Coming Soon</h3>
        </div>
        <p className="text-foreground text-sm">
          Notification settings will be implemented here. You&apos;ll be able to
          configure email notifications, push notifications, and other
          communication preferences.
        </p>
      </div>
    ),
    disabled: true,
    comingSoon: true,
  },
];

// Main settings page component
export default function SettingsPage() {
  const searchParams = useSearchParams();

  // Initialize active tab from URL, but manage locally for speed
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const fromUrl = searchParams.get('tab');
      let fromStorage = null;
      try {
        fromStorage = window.localStorage.getItem('settings.activeTab');
      } catch {}
      return fromUrl || fromStorage || 'general';
    }
    return 'general';
  });

  // Update URL without navigation when tab changes (debounced)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentTab = params.get('tab');
    if (currentTab !== activeTab) {
      params.set('tab', activeTab);
      window.history.replaceState(null, '', `/settings?${params.toString()}`);
    }
    try {
      window.localStorage.setItem('settings.activeTab', activeTab);
    } catch {}
  }, [activeTab, searchParams]);

  // Lightning-fast tab change handler - no router calls
  const handleTabChange = useCallback(
    (value: string) => {
      // Early return if same tab clicked - no work needed
      if (value === activeTab) {
        return;
      }

      setActiveTab(value);
    },
    [activeTab]
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Header section */}
      <header className="mb-8">
        <h1 className="mb-2 font-bold text-3xl">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </header>

      {/* Main content */}
      <main>
        <Tabs
          aria-label="Settings navigation"
          className="space-y-6"
          onValueChange={handleTabChange}
          value={activeTab}
        >
          {/* Tab navigation with smooth animations */}
          {/* Desktop grid */}
          <TabsList
            className="hidden w-full grid-cols-5 gap-2 sm:grid"
            role="tablist"
            transition={{ type: 'spring', stiffness: 500, damping: 50 }}
          >
            {TAB_CONFIGS.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  aria-label={`${tab.label} settings`}
                  className="flex items-center justify-center gap-2"
                  disabled={tab.disabled}
                  key={tab.id}
                  title={
                    tab.comingSoon ? `${tab.label} - Coming Soon` : tab.label
                  }
                  value={tab.id}
                >
                  <IconComponent aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden whitespace-nowrap md:inline">
                    {tab.label}
                  </span>
                  {tab.comingSoon && (
                    <span className="rounded bg-background px-1 text-foreground text-xs">
                      Soon
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Mobile horizontal scroll */}
          <TabsList
            className="no-scrollbar w-full overflow-x-auto sm:hidden"
            role="tablist"
          >
            <div className="flex min-w-max gap-2 px-1">
              {TAB_CONFIGS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger
                    aria-label={`${tab.label} settings`}
                    className="flex items-center gap-2 whitespace-nowrap rounded-md border border-transparent bg-background/50 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/40"
                    disabled={tab.disabled}
                    key={`mobile-${tab.id}`}
                    title={
                      tab.comingSoon ? `${tab.label} - Coming Soon` : tab.label
                    }
                    value={tab.id}
                  >
                    <IconComponent aria-hidden="true" className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="rounded bg-yellow-100 px-1 text-xs text-yellow-800">
                        Soon
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </div>
          </TabsList>
          <TabsContents
            className="-mt-2 mx-1 mb-1 rounded-sm bg-background"
            transition={{ type: false }}
          >
            {TAB_CONFIGS.map((tab) => {
              const Component = tab.component;
              return (
                <TabsContent
                  className="space-y-6 py-6"
                  key={tab.id}
                  value={tab.id}
                >
                  <Component />
                </TabsContent>
              );
            })}
          </TabsContents>
        </Tabs>
      </main>
    </div>
  );
}
