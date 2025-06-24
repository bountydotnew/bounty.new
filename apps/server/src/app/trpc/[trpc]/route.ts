import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/routers';
import { createContext } from '@/lib/context';
import { NextRequest } from 'next/server';

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: '/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req)
  });
}
export { handler as GET, handler as POST };
