import { appRouter, createContext } from '@bounty/api';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';

const STUDIO_ORIGIN = 'https://trpc-studio.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': STUDIO_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
} as const;

function addCorsHeaders(response: Response): Response {
  if (process.env.NODE_ENV !== 'development') {
    return response;
  }
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
}

async function handler(req: NextRequest) {
  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
  });
  return addCorsHeaders(response);
}

export function OPTIONS() {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 405 });
  }
  return new Response(null, { status: 204, headers: corsHeaders });
}

export { handler as GET, handler as POST };
