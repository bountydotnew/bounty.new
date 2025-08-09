import type { NextRequest } from "next/server";
import { auth } from "@bounty/auth/server";
import { db } from "@bounty/db";

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const cfConnectingIP = req.headers.get("cf-connecting-ip");

  let clientIP = forwarded || realIP || cfConnectingIP || "unknown";

  if (clientIP && clientIP.includes(",")) {
    clientIP = clientIP.split(",")[0].trim();
  }

  return clientIP;
}

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const clientIP = getClientIP(req);

  return {
    session,
    clientIP,
    req,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
