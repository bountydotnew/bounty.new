import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, mock } from 'bun:test';
import type { ReactNode } from 'react';
import { useBilling } from './use-billing-client';

// Mock the auth client
mock.module('@bounty/auth/client', () => ({
  authClient: {
    customer: {
      state: mock(async () => ({
        data: {
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
            'concurrent-bounties': {
              unlimited: false,
              balance: 10,
              usage: 2,
              included_usage: 10,
              interval: 'month',
              next_reset_at: '2025-11-01T00:00:00Z',
            },
          },
        },
      })),
      portal: mock(async () => {
        window.location.href = 'https://polar.sh/portal';
      }),
    },
    usage: {
      ingest: mock(async () => ({
        data: { success: true },
      })),
    },
    checkout: mock(async ({ slug }: { slug: string }) => {
      window.location.href = `https://polar.sh/checkout/${slug}`;
    }),
  },
}));

// Mock tRPC
mock.module('@/utils/trpc', () => ({
  trpc: {
    billing: {
      ensurePolarCustomer: {
        mutationOptions: () => ({
          mutationFn: mock(async () => ({ ok: true })),
        }),
      },
    },
  },
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useBilling', () => {
  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.customer).toBeUndefined();
      expect(result.current.isPro).toBe(false);
    });

    it('should use initialCustomerState if provided', () => {
      const initialState = {
        id: 'initial-customer',
        email: 'initial@example.com',
        products: [],
        activeSubscriptions: [],
        grantedBenefits: [],
        features: {},
      };

      const { result } = renderHook(
        () => useBilling({ enabled: true, initialCustomerState: initialState }),
        { wrapper: createWrapper() }
      );

      // Should immediately have initial data
      expect(result.current.customer).toEqual(initialState);
    });

    it('should not fetch if enabled is false', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const stateMock = mock(authClient.customer.state);

      renderHook(() => useBilling({ enabled: false }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(stateMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('Pro status detection', () => {
    it('should detect Pro status from products', async () => {
      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isPro).toBe(true);
    });

    it('should detect Pro status from active subscriptions', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalState = authClient.customer.state;

      authClient.customer.state = mock(async () => ({
        data: {
          id: 'test-customer',
          products: [],
          activeSubscriptions: [
            {
              id: 'sub-456',
              product: { slug: 'pro-annual' },
            },
          ],
          grantedBenefits: [],
          features: {},
        },
      }));

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isPro).toBe(true);
      });

      authClient.customer.state = originalState;
    });

    it('should detect Pro status from granted benefits', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalState = authClient.customer.state;

      authClient.customer.state = mock(async () => ({
        data: {
          id: 'test-customer',
          products: [],
          activeSubscriptions: [],
          grantedBenefits: [{ id: 'benefit-1', type: 'custom' }],
          features: {},
        },
      }));

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isPro).toBe(true);
      });

      authClient.customer.state = originalState;
    });

    it('should return false for free users', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalState = authClient.customer.state;

      authClient.customer.state = mock(async () => ({
        data: {
          id: 'test-customer',
          products: [],
          activeSubscriptions: [],
          grantedBenefits: [],
          features: {},
        },
      }));

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isPro).toBe(false);
      });

      authClient.customer.state = originalState;
    });
  });

  describe('feature parsing', () => {
    it('should parse lower fees feature correctly', async () => {
      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.lowerFees).toBeDefined();
      });

      expect(result.current.lowerFees.unlimited).toBe(true);
      expect(result.current.lowerFees.enabled).toBe(true);
      expect(result.current.lowerFees.usage).toBe(0);
    });

    it('should parse concurrent bounties feature correctly', async () => {
      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.concurrentBounties).toBeDefined();
      });

      expect(result.current.concurrentBounties.unlimited).toBe(false);
      expect(result.current.concurrentBounties.enabled).toBe(true);
      expect(result.current.concurrentBounties.total).toBe(10);
      expect(result.current.concurrentBounties.remaining).toBe(10);
      expect(result.current.concurrentBounties.usage).toBe(2);
    });

    it('should return default features if none exist', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalState = authClient.customer.state;

      authClient.customer.state = mock(async () => ({
        data: {
          id: 'test-customer',
          products: [],
          activeSubscriptions: [],
          grantedBenefits: [],
          features: {},
        },
      }));

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.lowerFees).toBeDefined();
      });

      expect(result.current.lowerFees.enabled).toBe(false);
      expect(result.current.concurrentBounties.enabled).toBe(false);

      authClient.customer.state = originalState;
    });
  });

  describe('billing portal', () => {
    it('should open billing portal', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const portalMock = mock(authClient.customer.portal);

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.openBillingPortal();

      expect(portalMock).toHaveBeenCalled();
    });

    it('should handle customer creation before opening portal', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalPortal = authClient.customer.portal;

      // Mock 404 error
      authClient.customer.portal = mock(async () => {
        const error = new Error('ResourceNotFound') as any;
        error.status = 404;
        error.detail = 'Customer does not exist';
        throw error;
      });

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.openBillingPortal();

      // Should trigger customer creation flow
      await waitFor(() => {
        expect(result.current.customer).toBeDefined();
      });

      authClient.customer.portal = originalPortal;
    });
  });

  describe('usage tracking', () => {
    it('should track usage events', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const ingestMock = mock(authClient.usage.ingest);

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.trackUsage('file-uploads', { count: 5 });

      expect(ingestMock).toHaveBeenCalledWith({
        event: 'file-uploads',
        metadata: { count: 5 },
      });
    });

    it('should handle customer creation before tracking usage', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalIngest = authClient.usage.ingest;

      // Mock 404 error
      authClient.usage.ingest = mock(async () => {
        const error = new Error('ResourceNotFound') as any;
        error.status = 404;
        error.detail = 'Customer does not exist';
        throw error;
      });

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.trackUsage('file-uploads', { count: 5 });

      // Should trigger customer creation flow
      await waitFor(() => {
        expect(result.current.customer).toBeDefined();
      });

      authClient.usage.ingest = originalIngest;
    });
  });

  describe('checkout', () => {
    it('should initiate checkout for pro-monthly', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const checkoutMock = mock(authClient.checkout);

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.checkout('pro-monthly');

      expect(checkoutMock).toHaveBeenCalledWith({ slug: 'pro-monthly' });
    });

    it('should initiate checkout for pro-annual', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const checkoutMock = mock(authClient.checkout);

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.checkout('pro-annual');

      expect(checkoutMock).toHaveBeenCalledWith({ slug: 'pro-annual' });
    });

    it('should handle customer creation before checkout', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalCheckout = authClient.checkout;

      // Mock 404 error
      authClient.checkout = mock(async () => {
        const error = new Error('ResourceNotFound') as any;
        error.status = 404;
        error.detail = 'Customer does not exist';
        throw error;
      });

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.checkout('pro-monthly');

      // Should trigger customer creation flow
      await waitFor(() => {
        expect(result.current.customer).toBeDefined();
      });

      authClient.checkout = originalCheckout;
    });
  });

  describe('error handling', () => {
    it('should handle 404 errors (new customer)', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalState = authClient.customer.state;

      authClient.customer.state = mock(async () => {
        const error = new Error('ResourceNotFound') as any;
        error.status = 404;
        error.detail = 'Customer does not exist';
        throw error;
      });

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.customer).toBeNull();

      authClient.customer.state = originalState;
    });

    it('should handle 403 errors (not permitted)', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalState = authClient.customer.state;

      authClient.customer.state = mock(async () => {
        const error = new Error('NotPermitted') as any;
        error.status = 403;
        throw error;
      });

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.customer).toBeNull();

      authClient.customer.state = originalState;
    });

    it('should handle 422 errors (validation)', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const originalState = authClient.customer.state;

      authClient.customer.state = mock(async () => {
        const error = new Error('Validation error') as any;
        error.status = 422;
        throw error;
      });

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.customer).toBeNull();

      authClient.customer.state = originalState;
    });
  });

  describe('refetch', () => {
    it('should refetch customer state', async () => {
      const { authClient } = await import('@bounty/auth/client');
      const stateMock = mock(authClient.customer.state);

      const { result } = renderHook(() => useBilling({ enabled: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = stateMock.mock.calls.length;

      await result.current.refetch();

      expect(stateMock.mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });
});
