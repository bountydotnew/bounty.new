import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook to link the current account with another account
 * This creates bidirectional links in the database
 */
export function useLinkAccount() {
  const queryClient = useQueryClient();
  const linkAccountMutation = useMutation({
    mutationFn: async (input: { linkedUserId: string }) => {
      return await trpcClient.user.linkAccount.mutate(input);
    },
    onSuccess: () => {
      // Invalidate linked accounts query to refresh the list
      const queryKey = trpc.user.getLinkedAccounts.queryKey();
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: unknown) => {
      // Check if it's a TRPC error with CONFLICT code
      if (
        typeof error === 'object' &&
        error !== null &&
        'data' in error &&
        typeof error.data === 'object' &&
        error.data !== null &&
        'code' in error.data &&
        error.data.code === 'CONFLICT'
      ) {
        // Don't show error if accounts are already linked
        return;
      }
      const message =
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof error.message === 'string'
          ? error.message
          : 'Failed to link account';
      toast.error(message);
    },
  });

  const linkAccount = useCallback(
    async (linkedUserId: string) => {
      try {
        await linkAccountMutation.mutateAsync({ linkedUserId });
        return true;
      } catch {
        // Error is handled by onError callback
        return false;
      }
    },
    [linkAccountMutation]
  );

  return {
    linkAccount,
    isLinking: linkAccountMutation.isPending,
  };
}

