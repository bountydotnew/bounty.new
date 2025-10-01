import { TRPCError } from '@trpc/server';
import { describe, expect, it, mock } from 'bun:test';

// Mock environment
mock.module('@bounty/env/server', () => ({
  env: {
    NODE_ENV: 'sandbox',
    POLAR_ACCESS_TOKEN: 'test-token',
  },
}));

// Mock Polar SDK
const mockPolarClient = {
  customers: {
    getExternal: mock(async ({ externalId }: { externalId: string }) => {
      if (externalId === 'existing-user') {
        return { id: 'polar-customer-123', externalId };
      }
      const error = new Error('ResourceNotFound') as any;
      error.status = 404;
      throw error;
    }),
    create: mock(async (params: any) => {
      if (params.externalId === 'create-error-user') {
        const error = new Error('Creation failed') as any;
        error.status = 500;
        throw error;
      }
      if (params.externalId === 'duplicate-user') {
        const error = new Error('external ID cannot be updated') as any;
        error.status = 409;
        throw error;
      }
      return {
        id: 'polar-customer-new',
        externalId: params.externalId,
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      };
    }),
  },
};

mock.module('@polar-sh/sdk', () => ({
  Polar: class {
    customers = mockPolarClient.customers;
  },
}));

describe('billing router', () => {
  describe('ensurePolarCustomer', () => {
    it('should return ok if customer already exists', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'existing-user',
            email: 'existing@example.com',
            name: 'Existing User',
          },
        },
      } as any);

      const result = await caller.ensurePolarCustomer();

      expect(result).toEqual({ ok: true });
      expect(mockPolarClient.customers.getExternal).toHaveBeenCalledWith({
        externalId: 'existing-user',
      });
    });

    it('should create customer if not found', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'new-user',
            email: 'new@example.com',
            name: 'New User',
          },
        },
      } as any);

      const result = await caller.ensurePolarCustomer();

      expect(result).toEqual({ ok: true });
      expect(mockPolarClient.customers.create).toHaveBeenCalledWith({
        externalId: 'new-user',
        email: 'new@example.com',
        name: 'New User',
        metadata: { userId: 'new-user' },
      });
    });

    it('should throw UNAUTHORIZED if no user session', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: null,
      } as any);

      try {
        await caller.ensurePolarCustomer();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('UNAUTHORIZED');
        expect((error as TRPCError).message).toBe('Authentication required');
      }
    });

    it('should throw UNAUTHORIZED if user has no ID', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: {
          user: {
            email: 'noId@example.com',
          },
        },
      } as any);

      try {
        await caller.ensurePolarCustomer();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('UNAUTHORIZED');
      }
    });

    it('should handle duplicate customer errors gracefully', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'duplicate-user',
            email: 'duplicate@example.com',
            name: 'Duplicate User',
          },
        },
      } as any);

      const result = await caller.ensurePolarCustomer();

      expect(result).toEqual({ ok: true });
    });

    it('should handle 409 conflict errors', async () => {
      const { billingRouter } = await import('./billing');

      const originalCreate = mockPolarClient.customers.create;
      mockPolarClient.customers.create = mock(async () => {
        const error = new Error('Conflict') as any;
        error.status = 409;
        throw error;
      });

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'conflict-user',
            email: 'conflict@example.com',
            name: 'Conflict User',
          },
        },
      } as any);

      const result = await caller.ensurePolarCustomer();

      expect(result).toEqual({ ok: true });

      mockPolarClient.customers.create = originalCreate;
    });

    it('should handle validation errors with external_id message', async () => {
      const { billingRouter } = await import('./billing');

      const originalCreate = mockPolarClient.customers.create;
      mockPolarClient.customers.create = mock(async () => {
        const error = new Error('external_id cannot be updated') as any;
        error.status = 422;
        throw error;
      });

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'validation-user',
            email: 'validation@example.com',
            name: 'Validation User',
          },
        },
      } as any);

      const result = await caller.ensurePolarCustomer();

      expect(result).toEqual({ ok: true });

      mockPolarClient.customers.create = originalCreate;
    });

    it('should handle PolarRequestValidationError', async () => {
      const { billingRouter } = await import('./billing');

      const originalCreate = mockPolarClient.customers.create;
      mockPolarClient.customers.create = mock(async () => {
        const error = new Error(
          '{"error":"PolarRequestValidationError"}'
        ) as any;
        error.body$ = '{"error":"PolarRequestValidationError"}';
        throw error;
      });

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'polar-validation-user',
            email: 'polar-validation@example.com',
            name: 'Polar Validation User',
          },
        },
      } as any);

      const result = await caller.ensurePolarCustomer();

      expect(result).toEqual({ ok: true });

      mockPolarClient.customers.create = originalCreate;
    });

    it('should throw INTERNAL_SERVER_ERROR for other create errors', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'create-error-user',
            email: 'error@example.com',
            name: 'Error User',
          },
        },
      } as any);

      try {
        await caller.ensurePolarCustomer();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).code).toBe('INTERNAL_SERVER_ERROR');
        expect((error as TRPCError).message).toBe(
          'Failed to ensure Polar customer'
        );
      }
    });

    it('should handle user with email but no name', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'email-only-user',
            email: 'email-only@example.com',
          },
        },
      } as any);

      const result = await caller.ensurePolarCustomer();

      expect(result).toEqual({ ok: true });
      expect(mockPolarClient.customers.create).toHaveBeenCalledWith({
        externalId: 'email-only-user',
        email: 'email-only@example.com',
        name: 'email-only@example.com',
        metadata: { userId: 'email-only-user' },
      });
    });

    it('should handle user with no email and no name', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'minimal-user',
          },
        },
      } as any);

      const result = await caller.ensurePolarCustomer();

      expect(result).toEqual({ ok: true });
      expect(mockPolarClient.customers.create).toHaveBeenCalledWith({
        externalId: 'minimal-user',
        email: undefined,
        name: undefined,
        metadata: { userId: 'minimal-user' },
      });
    });

    it('should proceed to create after non-404 getExternal error', async () => {
      const { billingRouter } = await import('./billing');

      const originalGetExternal = mockPolarClient.customers.getExternal;
      mockPolarClient.customers.getExternal = mock(async () => {
        const error = new Error('Service unavailable') as any;
        error.status = 503;
        throw error;
      });

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'service-error-user',
            email: 'service-error@example.com',
            name: 'Service Error User',
          },
        },
      } as any);

      const result = await caller.ensurePolarCustomer();

      expect(result).toEqual({ ok: true });

      mockPolarClient.customers.getExternal = originalGetExternal;
    });
  });

  describe('integration', () => {
    it('should handle complete flow for new user', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'integration-new-user',
            email: 'integration-new@example.com',
            name: 'Integration New User',
          },
        },
      } as any);

      // First call - customer doesn't exist
      const result = await caller.ensurePolarCustomer();
      expect(result).toEqual({ ok: true });

      // Verify customer was created with correct data
      expect(mockPolarClient.customers.create).toHaveBeenCalledWith({
        externalId: 'integration-new-user',
        email: 'integration-new@example.com',
        name: 'Integration New User',
        metadata: { userId: 'integration-new-user' },
      });
    });

    it('should handle complete flow for existing user', async () => {
      const { billingRouter } = await import('./billing');

      const caller = billingRouter.createCaller({
        session: {
          user: {
            id: 'existing-user',
            email: 'existing@example.com',
            name: 'Existing User',
          },
        },
      } as any);

      // Call for existing customer
      const result = await caller.ensurePolarCustomer();
      expect(result).toEqual({ ok: true });

      // Should not create a new customer
      const createCallsBefore = mockPolarClient.customers.create.mock.calls
        .length;
      await caller.ensurePolarCustomer();
      const createCallsAfter = mockPolarClient.customers.create.mock.calls
        .length;

      expect(createCallsAfter).toBe(createCallsBefore);
    });
  });
});
