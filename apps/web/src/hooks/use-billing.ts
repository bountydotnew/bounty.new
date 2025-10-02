import type { CustomerState } from '@bounty/types/billing';
import { useBilling as useBaseBilling } from '@bounty/ui/hooks/use-billing-client';
import { trpcClient } from '@/utils/trpc';

/**
 * App-specific wrapper for useBilling that provides tRPC mutation
 */
export function useBilling(options?: {
  enabled?: boolean;
  initialCustomerState?: CustomerState | null;
}) {
  return useBaseBilling({
    ...options,
    ensurePolarCustomer: async () => {
      await trpcClient.billing.ensurePolarCustomer.mutate();
    },
  });
}
