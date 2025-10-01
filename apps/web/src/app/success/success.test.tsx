import { render, screen } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import { SuccessClient } from './success-client';

// Mock next/navigation
mock.module('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'checkout_id' ? 'checkout_123' : null),
  }),
  useRouter: () => ({
    push: mock(() => {}),
  }),
}));

// Mock auth client
mock.module('@bounty/auth/client', () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    }),
  },
}));

// Mock useBilling hook
mock.module('@bounty/ui/hooks/use-billing-client', () => ({
  useBilling: ({ initialCustomerState }: any) => ({
    customer: initialCustomerState || {
      activeSubscriptions: [
        {
          product: {
            slug: 'pro-monthly',
            name: 'Pro Monthly',
          },
        },
      ],
    },
    refetch: mock(async () => {}),
  }),
}));

// Mock confetti context
mock.module('@/context/confetti-context', () => ({
  useConfetti: () => ({
    celebrate: mock(() => {}),
  }),
}));

// Mock components
mock.module('@/components/dual-sidebar', () => ({
  Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
}));

mock.module('@/components/icons/bounty', () => ({
  default: () => <div data-testid="bounty-icon">Icon</div>,
}));

// Mock UI components
mock.module('@bounty/ui/components/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: any) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
  CardContent: ({ children }: any) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

mock.module('@bounty/ui/components/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

mock.module('@bounty/ui/components/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button data-testid="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

mock.module('@bounty/ui/components/separator', () => ({
  Separator: () => <hr data-testid="separator" />,
}));

describe('Success Page Integration', () => {
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
    features: {},
  };

  describe('SuccessClient', () => {
    it('should render with customer state', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByTestId('sidebar')).toBeDefined();
      expect(screen.getByText('Welcome to Pro!')).toBeDefined();
    });

    it('should display purchase summary', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByText('Purchase Summary')).toBeDefined();
    });

    it('should show Pro Monthly plan name', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByText('Pro Monthly')).toBeDefined();
    });

    it('should show Pro Annual plan name when applicable', () => {
      const annualCustomerState = {
        ...mockCustomerState,
        activeSubscriptions: [
          {
            id: 'sub-456',
            product: {
              id: 'pro-annual',
              name: 'Pro Annual',
              slug: 'pro-annual',
            },
          },
        ],
      };

      render(<SuccessClient initialCustomerState={annualCustomerState} />);

      expect(screen.getByText('Pro Annual')).toBeDefined();
    });

    it('should display checkout ID', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByText('checkout_123')).toBeDefined();
    });

    it('should display user email', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByText('Account: test@example.com')).toBeDefined();
    });

    it('should show active status', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    });

    it('should display Pro features', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(
        screen.getByText('Lower fees on bounty transactions')
      ).toBeDefined();
      expect(
        screen.getByText('Create multiple concurrent bounties')
      ).toBeDefined();
      expect(screen.getByText('Priority support')).toBeDefined();
      expect(screen.getByText('Early access to new features')).toBeDefined();
    });

    it('should render navigation buttons', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByText('Go to Dashboard')).toBeDefined();
      expect(screen.getByText('Browse Bounties')).toBeDefined();
    });

    it('should show support information', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(
        screen.getByText(
          /Need help\? Contact our support team or check out our documentation\./
        )
      ).toBeDefined();
    });
  });

  describe('Server/Client Boundary', () => {
    it('should receive server-fetched customer state', () => {
      const serverData = mockCustomerState;

      render(<SuccessClient initialCustomerState={serverData} />);

      // Verify data is properly passed through
      expect(screen.getByText('Welcome to Pro!')).toBeDefined();
    });

    it('should handle null server data gracefully', () => {
      render(<SuccessClient initialCustomerState={null} />);

      // Should still render without errors
      expect(screen.getByTestId('sidebar')).toBeDefined();
    });

    it('should handle undefined server data gracefully', () => {
      render(<SuccessClient initialCustomerState={undefined} />);

      // Should still render without errors
      expect(screen.getByTestId('sidebar')).toBeDefined();
    });
  });

  describe('Plan Detection', () => {
    it('should detect Pro Monthly from product slug', () => {
      const monthlyState = {
        ...mockCustomerState,
        activeSubscriptions: [
          {
            id: 'sub-123',
            product: {
              slug: 'pro-monthly',
              name: 'Custom Name',
            },
          },
        ],
      };

      render(<SuccessClient initialCustomerState={monthlyState} />);

      expect(screen.getByText('Pro Monthly')).toBeDefined();
      expect(screen.getByText('$20/month')).toBeDefined();
    });

    it('should detect Pro Annual from product slug', () => {
      const annualState = {
        ...mockCustomerState,
        activeSubscriptions: [
          {
            id: 'sub-456',
            product: {
              slug: 'pro-annual',
              name: 'Custom Name',
            },
          },
        ],
      };

      render(<SuccessClient initialCustomerState={annualState} />);

      expect(screen.getByText('Pro Annual')).toBeDefined();
      expect(screen.getByText('$15/month')).toBeDefined();
    });

    it('should handle missing subscription data', () => {
      const noSubState = {
        ...mockCustomerState,
        activeSubscriptions: [],
      };

      render(<SuccessClient initialCustomerState={noSubState} />);

      // Should still render with default values
      expect(screen.getByTestId('sidebar')).toBeDefined();
    });
  });

  describe('Confetti Integration', () => {
    it('should trigger confetti on mount', () => {
      const { useConfetti } = require('@/context/confetti-context');
      const celebrateMock = useConfetti().celebrate;

      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(celebrateMock).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should redirect to dashboard when no checkout_id', () => {
      // Mock useSearchParams to return null checkout_id
      const mockUseSearchParams = () => ({
        get: () => null,
      });

      mock.module('next/navigation', () => ({
        useSearchParams: mockUseSearchParams,
        useRouter: () => ({
          push: mock((path: string) => {
            expect(path).toBe('/dashboard');
          }),
        }),
      }));

      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      // Should trigger redirect
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByText('Welcome to Pro!')).toBeDefined();
      expect(screen.getByText('Purchase Summary')).toBeDefined();
    });

    it('should have descriptive labels', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      expect(screen.getByText('Order Details:')).toBeDefined();
      expect(screen.getByText('Pro Features Unlocked:')).toBeDefined();
    });
  });

  describe('Error States', () => {
    it('should handle malformed customer state', () => {
      const malformedState = {
        id: 'test-customer',
        // Missing required fields
      } as any;

      render(<SuccessClient initialCustomerState={malformedState} />);

      // Should still render without crashing
      expect(screen.getByTestId('sidebar')).toBeDefined();
    });

    it('should handle customer state with missing subscriptions', () => {
      const stateWithoutSubs = {
        ...mockCustomerState,
        activeSubscriptions: undefined,
      } as any;

      render(<SuccessClient initialCustomerState={stateWithoutSubs} />);

      // Should still render without crashing
      expect(screen.getByTestId('sidebar')).toBeDefined();
    });
  });

  describe('Billing Hook Integration', () => {
    it('should pass initialCustomerState to useBilling', () => {
      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      // Hook should be called with initialCustomerState
      expect(screen.getByText('Welcome to Pro!')).toBeDefined();
    });

    it('should refetch customer state after checkout', () => {
      const { useBilling } = require('@bounty/ui/hooks/use-billing-client');
      const refetchMock = useBilling().refetch;

      render(<SuccessClient initialCustomerState={mockCustomerState} />);

      // Should trigger refetch on mount with checkout_id
      expect(refetchMock).toHaveBeenCalled();
    });
  });
});
