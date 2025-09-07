import { createContext, orpcRouter } from '@bounty/api';
import type { NextRequest } from 'next/server';
import { RPCHandler } from '@orpc/server/fetch';

const handler = async (req: NextRequest) => {
  const rpcHandler = new RPCHandler(orpcRouter);
  const { response } = await rpcHandler.handle(req as unknown as Request, {
    context: await createContext(req),
  });
  return response ?? new Response('Not Found', { status: 404 });
};

export { handler as GET, handler as POST };

