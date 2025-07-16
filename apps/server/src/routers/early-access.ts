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
        
        console.log("[joinWaitlist] Client IP:", identifier);
        console.log("[joinWaitlist] Rate limiting check for identifier:", identifier);
        
        let response;
        try {
          response = await unkey.limit(identifier);
          console.log("[joinWaitlist] Rate limit response:", response);
        } catch (unkeyError) {
          console.error("[joinWaitlist] Unkey error:", unkeyError);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Rate limiting service error",
          });
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