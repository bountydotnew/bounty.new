import { auth } from "@bounty/auth/server";
import { toNextJsHandler } from "better-auth/next-js";

const allowedOrigins = new Set([
  'https://bounty.new',
  'https://www.bounty.new',
  'https://local.bounty.new',
  'https://preview.bounty.new',
]);

const corsHeaders = (origin: string | null) => {
  const headers = new Headers();
  if (origin && allowedOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  return headers;
};

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

const authHandler = toNextJsHandler(auth);

export async function GET(req: Request) {
  const origin = req.headers.get('origin');
  const response = await authHandler.GET(req);
  const headers = corsHeaders(origin);
  response.headers.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { ...response, headers });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const response = await authHandler.POST(req);
  const headers = corsHeaders(origin);
  response.headers.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { ...response, headers });
}