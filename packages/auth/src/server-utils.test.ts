import { describe, expect, it, mock } from 'bun:test';
import { headers } from 'next/headers';
import { getServerCustomerState, getServerSession } from './server-utils';

// Mock the auth client
mock.module('./client', () => ({
  authClient: {
    getSession: mock(async () => ({
      data: {
        user: { id: 'test-user', email: 'test@example.com' },
        session: { id: 'test-session' },
      },
      error: null,
    })),
    customer: {
      state: mock(async () => ({
        data: {
          id: 'test-customer',
          email: 'test@example.com',
          products: [],
          activeSubscriptions: [],
          grantedBenefits: [],
          features: {},
        },
        error: null,
      })),
    },
  },
}));

describe('server-utils', () => {
  describe('getServerSession', () => {
    it('should fetch session with headers', async () => {
      const result = await getServerSession();

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data?.user).toBeDefined();
      expect(result.data?.user.id).toBe('test-user');
    });

    it('should handle session fetch errors', async () => {
      const { authClient } = await import('./client');
      const originalGetSession = authClient.getSession;

      // Mock error response
      authClient.getSession = mock(async () => {
        throw new Error('Session fetch failed');
      });

      const result = await getServerSession();

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Session fetch failed');

      // Restore original
      authClient.getSession = originalGetSession;
    });

    it('should pass headers correctly', async () => {
      const { authClient } = await import('./client');
      const getSessionMock = mock(authClient.getSession);

      await getServerSession();

      expect(getSessionMock).toHaveBeenCalledWith({
        fetchOptions: {
          headers: expect.any(Object),
        },
      });
    });

    it('should cache results within same render', async () => {
      const { authClient } = await import('./client');
      const getSessionMock = mock(authClient.getSession);

      // Call twice in same render
      const result1 = await getServerSession();
      const result2 = await getServerSession();

      // Should return same reference (cached)
      expect(result1).toBe(result2);

      // Should only call once due to React cache
      expect(getSessionMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getServerCustomerState', () => {
    it('should fetch customer state with headers', async () => {
      const result = await getServerCustomerState();

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe('test@example.com');
    });

    it('should handle customer state fetch errors', async () => {
      const { authClient } = await import('./client');
      const originalCustomerState = authClient.customer.state;

      // Mock error response
      authClient.customer.state = mock(async () => {
        throw new Error('Customer state fetch failed');
      });

      const result = await getServerCustomerState();

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Customer state fetch failed');

      // Restore original
      authClient.customer.state = originalCustomerState;
    });

    it('should pass headers correctly', async () => {
      const { authClient } = await import('./client');
      const customerStateMock = mock(authClient.customer.state);

      await getServerCustomerState();

      expect(customerStateMock).toHaveBeenCalledWith({
        fetchOptions: {
          headers: expect.any(Object),
        },
      });
    });

    it('should cache results within same render', async () => {
      const { authClient } = await import('./client');
      const customerStateMock = mock(authClient.customer.state);

      // Call twice in same render
      const result1 = await getServerCustomerState();
      const result2 = await getServerCustomerState();

      // Should return same reference (cached)
      expect(result1).toBe(result2);

      // Should only call once due to React cache
      expect(customerStateMock).toHaveBeenCalledTimes(1);
    });

    it('should handle Polar 404 errors gracefully', async () => {
      const { authClient } = await import('./client');
      const originalCustomerState = authClient.customer.state;

      // Mock 404 error (new customer)
      authClient.customer.state = mock(async () => {
        const error = new Error('ResourceNotFound') as any;
        error.status = 404;
        error.detail = 'Customer does not exist';
        throw error;
      });

      const result = await getServerCustomerState();

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();

      // Restore original
      authClient.customer.state = originalCustomerState;
    });
  });

  describe('integration', () => {
    it('should work together for authenticated page loads', async () => {
      const session = await getServerSession();
      const customerState = await getServerCustomerState();

      expect(session.data).toBeDefined();
      expect(customerState.data).toBeDefined();

      // Should have matching user/customer data
      expect(session.data?.user.email).toBe(customerState.data?.email);
    });

    it('should handle unauthenticated users', async () => {
      const { authClient } = await import('./client');
      const originalGetSession = authClient.getSession;

      // Mock unauthenticated response
      authClient.getSession = mock(async () => ({
        data: null,
        error: null,
      }));

      const session = await getServerSession();

      expect(session.data).toBeNull();

      // Restore original
      authClient.getSession = originalGetSession;
    });
  });
});
