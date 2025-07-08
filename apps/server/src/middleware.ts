import { NextResponse } from "next/server";

export function middleware() {
  const res = NextResponse.next()

  const allowedOrigins = [
    process.env.CORS_ORIGIN || "",
    "https://bounty.new",
    "https://www.bounty.new"
  ].filter(Boolean);

  const origin = res.headers.get('origin');
  const allowedOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];

  res.headers.append('Access-Control-Allow-Credentials', "true")
  res.headers.append('Access-Control-Allow-Origin', allowedOrigin || "")
  res.headers.append('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.headers.append(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )

  return res
}

export const config = {
  matcher: '/:path*',
}
