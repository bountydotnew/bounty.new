import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { appRouter } from '@bounty/api';

export const trpcServer = createTRPCProxyClient<typeof appRouter>({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/trpc`,
    }),
  ],
}); 