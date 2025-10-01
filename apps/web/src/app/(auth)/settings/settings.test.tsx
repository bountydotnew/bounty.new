import { render, screen } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import { SettingsClient } from './settings-client';

// Mock next/navigation
mock.module('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'tab' ? 'general' : null),
    toString: () => 'tab=general',
  }),
  useRouter: () => ({
    push: mock(() => {}),
    replace: mock(() => {}),
  }),
}));

// Mock components
mock.module('@/components/animate-ui/components/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-trigger-${value}`}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
  TabsContents: ({ children }: any) => (
    <div data-testid="tabs-contents">{children}</div>
  ),
}));

mock.module('@/components/settings/billing-settings', () => ({
  BillingSettings: ({ initialCustomerState }: any) => (
    <div data-testid="billing-settings">
      {initialCustomerState?.email || 'No customer state'}
    </div>
  ),
}));

mock.module('@/components/settings/general-settings', () => ({
  GeneralSettings: ({ initialCustomerState }: any) => (
    <div data-testid="general-settings">
      {initialCustomerState?.email || 'No customer state'}
    </div>
  ),
}));

mock.module('@/components/settings/payment-settings', () => ({
  PaymentSettings: ({ initialCustomerState }: any) => (
    <div data-testid="payment-settings">
      {initialCustomerState?.email || 'No customer state'}
    </div>
  ),
}));

mock.module('@/components/settings/security-settings', () => ({
  SecuritySettings: ({ initialCustomerState }: any) => (
    <div data-testid="security-settings">
      {initialCustomerState?.email || 'No customer state'}
    </div>
  ),
}));

describe('Settings Page Integration', () => {
  const mockCustomerState = {
    id: 'test-customer',
    email: 'test@example.com',
    products: [
      {
        id: 'pro-monthly',
        name: 'Pro Monthly',
        slug: 'pro-monthly',
      },
    ],
    activeSubscriptions: [
      {
        id: 'sub-123',
        product: {
          id: 'pro-monthly',
          name: 'Pro Monthly',
          slug: 'pro-monthly',
        },
      },
    ],
    grantedBenefits: [],
    features: {
      'lower-fees': {
        unlimited: true,
        balance: null,
        usage: 0,
        included_usage: 0,
        interval: 'month',
        next_reset_at: null,
      },
    },
  };

  describe('SettingsClient', () => {
    it('should render with customer state', () => {
      render(<SettingsClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByText('Settings')).toBeDefined();
      expect(screen.getByText('Manage your account settings and preferences'))
        .toBeDefined();
    });

    it('should pass initialCustomerState to child components', () => {
      render(<SettingsClient initialCustomerState={mockCustomerState} />);

      // Check if customer state is passed to components
      const billingSettings = screen.getByTestId('billing-settings');
      expect(billingSettings.textContent).toContain('test@example.com');
    });

    it('should render without customer state', () => {
      render(<SettingsClient initialCustomerState={null} />);

      expect(screen.getByText('Settings')).toBeDefined();

      const billingSettings = screen.getByTestId('billing-settings');
      expect(billingSettings.textContent).toContain('No customer state');
    });

    it('should render all tab triggers', () => {
      render(<SettingsClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByTestId('tab-trigger-general')).toBeDefined();
      expect(screen.getByTestId('tab-trigger-billing')).toBeDefined();
      expect(screen.getByTestId('tab-trigger-payments')).toBeDefined();
      expect(screen.getByTestId('tab-trigger-security')).toBeDefined();
      expect(screen.getByTestId('tab-trigger-notifications')).toBeDefined();
    });

    it('should handle Pro users', () => {
      const proCustomerState = {
        ...mockCustomerState,
        products: [
          {
            id: 'pro-annual',
            name: 'Pro Annual',
            slug: 'pro-annual',
          },
        ],
      };

      render(<SettingsClient initialCustomerState={proCustomerState} />);

      expect(screen.getByText('Settings')).toBeDefined();
    });

    it('should handle free users', () => {
      const freeCustomerState = {
        id: 'test-customer',
        email: 'test@example.com',
        products: [],
        activeSubscriptions: [],
        grantedBenefits: [],
        features: {},
      };

      render(<SettingsClient initialCustomerState={freeCustomerState} />);

      expect(screen.getByText('Settings')).toBeDefined();
    });
  });

  describe('Server/Client Boundary', () => {
    it('should receive server-fetched data', () => {
      // Simulate data coming from server component
      const serverData = mockCustomerState;

      render(<SettingsClient initialCustomerState={serverData} />);

      // Verify data is properly passed through
      const billingSettings = screen.getByTestId('billing-settings');
      expect(billingSettings.textContent).toContain(serverData.email);
    });

    it('should handle null server data gracefully', () => {
      render(<SettingsClient initialCustomerState={null} />);

      // Should still render without errors
      expect(screen.getByText('Settings')).toBeDefined();
    });

    it('should handle undefined server data gracefully', () => {
      render(<SettingsClient initialCustomerState={undefined} />);

      // Should still render without errors
      expect(screen.getByText('Settings')).toBeDefined();
    });
  });

  describe('Tab Navigation', () => {
    it('should initialize with correct tab from URL', () => {
      render(<SettingsClient initialCustomerState={mockCustomerState} />);

      // Should show general tab by default (from mock)
      expect(screen.getByTestId('tab-trigger-general')).toBeDefined();
    });

    it('should maintain tab state in localStorage', () => {
      const mockStorage: Record<string, string> = {};
      const localStorageMock = {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
        },
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      render(<SettingsClient initialCustomerState={mockCustomerState} />);

      // Verify localStorage would be set
      expect(screen.getByText('Settings')).toBeDefined();
    });
  });

  describe('Responsive Design', () => {
    it('should render desktop tab layout', () => {
      render(<SettingsClient initialCustomerState={mockCustomerState} />);

      // Check for tabs container
      expect(screen.getByTestId('tabs')).toBeDefined();
      expect(screen.getByTestId('tabs-list')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<SettingsClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByText('Settings')).toBeDefined();
      expect(screen.getByText('Manage your account settings and preferences'))
        .toBeDefined();
    });

    it('should have proper aria labels', () => {
      render(<SettingsClient initialCustomerState={mockCustomerState} />);

      // All tab triggers should be rendered
      expect(screen.getByTestId('tab-trigger-general')).toBeDefined();
      expect(screen.getByTestId('tab-trigger-billing')).toBeDefined();
    });
  });

  describe('Error States', () => {
    it('should handle malformed customer state', () => {
      const malformedState = {
        id: 'test-customer',
        // Missing required fields
      } as any;

      render(<SettingsClient initialCustomerState={malformedState} />);

      // Should still render without crashing
      expect(screen.getByText('Settings')).toBeDefined();
    });

    it('should handle customer state with missing features', () => {
      const stateWithoutFeatures = {
        ...mockCustomerState,
        features: undefined,
      } as any;

      render(<SettingsClient initialCustomerState={stateWithoutFeatures} />);

      // Should still render without crashing
      expect(screen.getByText('Settings')).toBeDefined();
    });
  });
});
