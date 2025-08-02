"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-yellow-600" />
          <h3 className="font-medium text-yellow-800">Coming Soon</h3>
        </div>
        <p className="text-sm text-yellow-700">
          Notification settings will be implemented here. You&apos;ll be able to configure
          email notifications, push notifications, and other communication preferences.
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
    const tabParam = searchParams.get("tab");
    return tabParam || "general";
  });

  // Update URL without navigation when tab changes (debounced)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentTab = params.get("tab");
    
    if (currentTab !== activeTab) {
      params.set("tab", activeTab);
      // Use history.replaceState for instant updates without re-rendering
      window.history.replaceState(null, "", `/settings?${params.toString()}`);
    }
  }, [activeTab, searchParams]);

  // Lightning-fast tab change handler - no router calls
  const handleTabChange = useCallback((value: string) => {
    // Early return if same tab clicked - no work needed
    if (value === activeTab) return;
    
    setActiveTab(value);
  }, [activeTab]);

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
          <TabsList 
            className={`grid w-full grid-cols-${TAB_CONFIGS.length} relative`}
            role="tablist"
          >
            {TAB_CONFIGS.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 transition-all duration-300 ease-out relative z-10"
                  disabled={tab.disabled}
                  aria-label={`${tab.label} settings`}
                  title={tab.comingSoon ? `${tab.label} - Coming Soon` : tab.label}
                >
                  <IconComponent 
                    className="w-4 h-4" 
                    aria-hidden="true" 
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                  {tab.comingSoon && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                      Soon
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Preload and keep all tab components mounted for instant switching */}
          <div className="relative">
            {TAB_CONFIGS.map((tab) => {
              const Component = tab.component;
              return (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="space-y-6 focus:outline-none data-[state=inactive]:hidden"
                  role="tabpanel"
                  aria-labelledby={`tab-${tab.id}`}
                >
                  {/* Keep components mounted to prevent re-fetching */}
                  <Component />
                </TabsContent>
              );
            })}
          </div>
        </Tabs>
      </main>
    </div>
  );
}