import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const res = NextResponse.next()

  const allowedOrigins = [
    process.env.CORS_ORIGIN || "",
    "https://bounty.new",
    "https://www.bounty.new",
    "https://bounty-new-server.vercel.app/",
    "https://bounty.ripgrim.com",
    "https://bounty-new-web.vercel.app/",
    "https://preview.bounty.new",
    "https://preview.api.bounty.new",
  ].filter(Boolean);

  const origin = request.headers.get('origin');
  const allowedOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];

  res.headers.set('Access-Control-Allow-Credentials', "true")
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin || "*")
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE')
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  )

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: res.headers });
  }

  return res
}

export const config = {
  matcher: [
    '/trpc/:path*',
    '/api/:path*'
  ],
}
