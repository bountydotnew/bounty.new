"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "@/components/animate-ui/components/tabs";
import { GeneralSettings } from "@/components/settings/general-settings";
import { BillingSettings } from "@/components/settings/billing-settings";
import { PaymentSettings } from "@/components/settings/payment-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { User, CreditCard, DollarSign, Shield, Bell } from "lucide-react";

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
    id: "general",
    label: "General",
    icon: User,
    component: GeneralSettings,
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    component: BillingSettings,
  },
  {
    id: "payments",
    label: "Payments",
    icon: DollarSign,
    component: PaymentSettings,
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    component: SecuritySettings,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    component: () => (
      <div className="bg-card border border-dashed border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-foreground" />
          <h3 className="font-medium text-foreground">Coming Soon</h3>
        </div>
        <p className="text-sm text-foreground">
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
    if (typeof window !== "undefined") {
      const fromUrl = searchParams.get("tab");
      let fromStorage = null;
      try {
        fromStorage = window.localStorage.getItem("settings.activeTab");
      } catch {
        console.error("Error getting active tab from localStorage");
      }
      return fromUrl || fromStorage || "general";
    }
    return "general";
  });

  // Update URL without navigation when tab changes (debounced)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentTab = params.get("tab");
    if (currentTab !== activeTab) {
      params.set("tab", activeTab);
      window.history.replaceState(null, "", `/settings?${params.toString()}`);
    }
    try {
      window.localStorage.setItem("settings.activeTab", activeTab);
    } catch {}
  }, [activeTab, searchParams]);

  // Lightning-fast tab change handler - no router calls
  const handleTabChange = useCallback(
    (value: string) => {
      // Early return if same tab clicked - no work needed
      if (value === activeTab) return;

      setActiveTab(value);
    },
    [activeTab],
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header section */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </header>

      {/* Main content */}
      <main>
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
          aria-label="Settings navigation"
        >
          {/* Tab navigation with smooth animations */}
          {/* Desktop grid */}
          <TabsList
            transition={{ type: "spring", stiffness: 500, damping: 50 }}
            className="hidden sm:grid w-full grid-cols-5 gap-2"
            role="tablist"
          >
            {TAB_CONFIGS.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center justify-center gap-2"
                  disabled={tab.disabled}
                  aria-label={`${tab.label} settings`}
                  title={
                    tab.comingSoon ? `${tab.label} - Coming Soon` : tab.label
                  }
                >
                  <IconComponent className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden md:inline whitespace-nowrap">
                    {tab.label}
                  </span>
                  {tab.comingSoon && (
                    <span className="text-xs bg-background text-foreground px-1 rounded">
                      Soon
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Mobile horizontal scroll */}
          <TabsList
            className="sm:hidden w-full overflow-x-auto no-scrollbar"
            role="tablist"
          >
            <div className="flex min-w-max gap-2 px-1">
              {TAB_CONFIGS.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger
                    key={`mobile-${tab.id}`}
                    value={tab.id}
                    className="flex items-center gap-2 px-4 py-2 whitespace-nowrap rounded-md border border-transparent bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/40"
                    disabled={tab.disabled}
                    aria-label={`${tab.label} settings`}
                    title={
                      tab.comingSoon ? `${tab.label} - Coming Soon` : tab.label
                    }
                  >
                    <IconComponent className="w-4 h-4" aria-hidden="true" />
                    <span>{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                        Soon
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </div>
          </TabsList>
          <TabsContents
            transition={{ type: false }}
            className="mx-1 mb-1 -mt-2 rounded-sm bg-background"
          >
            {TAB_CONFIGS.map((tab) => {
              const Component = tab.component;
              return (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="space-y-6 py-6"
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
