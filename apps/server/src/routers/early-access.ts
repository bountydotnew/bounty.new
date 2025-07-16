import { TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { Ratelimit } from "@unkey/ratelimit";

import { db } from "../db";
import { waitlist } from "../db/schema/auth";
import { publicProcedure, router } from "../lib/trpc";
import { getClientIP } from "../lib/utils";

const unkey = new Ratelimit({
  rootKey: process.env.UNKEY_ROOT_KEY || "",
  namespace: "waitlist-server",
  limit: 5,
  duration: "60s",
  async: false,
});

// Backup rate limiting - in-memory counter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function backupRateLimit(identifier: string, limit: number = 5, windowMs: number = 60000): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const stored = rateLimitStore.get(identifier);
  
  if (!stored || now > stored.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }
  
  if (stored.count >= limit) {
    return { success: false, remaining: 0, reset: stored.resetTime };
  }
  
  stored.count++;
  return { success: true, remaining: limit - stored.count, reset: stored.resetTime };
}

console.log("[Unkey] Configuration:", {
  hasRootKey: !!process.env.UNKEY_ROOT_KEY,
  rootKeyPreview: process.env.UNKEY_ROOT_KEY?.substring(0, 10) + "...",
  namespace: "waitlist-server",
  limit: 5,
  duration: "60s"
});

export const earlyAccessRouter = router({
  getWaitlistCount: publicProcedure.query(async () => {
    try {
      console.log("[getWaitlistCount] called");
      const waitlistCount = await db.select({ count: count() }).from(waitlist);
      console.log("[getWaitlistCount] db result:", waitlistCount);

      if (!waitlistCount[0] || typeof waitlistCount[0].count !== "number") {
        console.error("[getWaitlistCount] Invalid result:", waitlistCount);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get waitlist count",
        });
      }

      return {
        count: waitlistCount[0].count,
      };
    } catch (err) {
      console.error("[getWaitlistCount] Error:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get waitlist count",
      });
    }
  }),
  joinWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const identifier = getClientIP(ctx);
        
        console.log("=== RATE LIMITING DEBUG ===");
        console.log("[joinWaitlist] Client IP:", identifier);
        console.log("[joinWaitlist] Input email:", input.email);
        console.log("[joinWaitlist] Context keys:", Object.keys(ctx));
        console.log("[joinWaitlist] Has Unkey key:", !!process.env.UNKEY_ROOT_KEY);
        
        // FORCE RATE LIMITING FOR TESTING
        if (identifier === 'unknown') {
          console.log("[joinWaitlist] IP is unknown - blocking by default");
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS", 
            message: "Rate limit exceeded - IP unknown",
          });
        }
        
        // Try backup rate limiting first
        const backupResult = backupRateLimit(identifier, 5, 60000);
        console.log("[joinWaitlist] Backup rate limit result:", backupResult);
        
        if (!backupResult.success) {
          console.log("[joinWaitlist] BACKUP RATE LIMIT EXCEEDED for:", identifier);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Rate limit exceeded (backup). Try again in ${Math.ceil((backupResult.reset - Date.now()) / 60000)} minutes.`,
          });
        }
        
        let response;
        try {
          console.log("[joinWaitlist] Calling Unkey with identifier:", identifier);
          response = await unkey.limit(identifier);
          console.log("[joinWaitlist] Unkey response SUCCESS:", JSON.stringify(response, null, 2));
        } catch (unkeyError) {
          console.error("[joinWaitlist] Unkey error:", unkeyError);
          console.log("[joinWaitlist] Using backup rate limiting only");
          response = backupResult; // Use backup result if Unkey fails
        }
        
        if (!response.success) {
          console.log("[joinWaitlist] Rate limit exceeded for:", identifier);
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Rate limit exceeded. Try again in ${Math.ceil((response.reset - Date.now()) / 60000)} minutes.`,
          });
        }
        
        console.log("[joinWaitlist] Rate limit passed, remaining:", response.remaining);

        const userAlreadyInWaitlist = await db
          .select()
          .from(waitlist)
          .where(eq(waitlist.email, input.email));

        if (userAlreadyInWaitlist[0]) {
          return { message: "You're already on the waitlist!" };
        }

        await db.insert(waitlist).values({
          email: input.email,
          createdAt: new Date(),
        });

        return { message: "You've been added to the waitlist!" };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        
        console.error("[joinWaitlist] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to join waitlist",
        });
      }
    }),
}); 