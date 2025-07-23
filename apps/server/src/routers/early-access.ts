import { TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { grim } from "../lib/use-dev-log";

const { error, info, warn } = grim();


import { db, waitlist } from "@bounty/db";
import { publicProcedure, router } from "../lib/trpc";

export const earlyAccessRouter = router({
  getWaitlistCount: publicProcedure.query(async () => {
    try {
      info("[getWaitlistCount] called");
      const waitlistCount = await db.select({ count: count() }).from(waitlist);
      info("[getWaitlistCount] db result:", waitlistCount);

      if (!waitlistCount[0] || typeof waitlistCount[0].count !== "number") {
        error("[getWaitlistCount] Invalid result:", waitlistCount);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid database response",
        });
      }

      return {
        count: waitlistCount[0].count,
      };
    } catch (err) {
      error("[getWaitlistCount] Error:", err);
      
      // Provide more specific error messages
      if (err instanceof TRPCError) {
        throw err;
      }
      
      // Database connection errors
      if (err instanceof Error) {
        if (err.message.includes('connect') || err.message.includes('ECONNREFUSED')) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }
        
        if (err.message.includes('does not exist') || err.message.includes('relation')) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database table not found - migrations may not be applied",
          });
        }
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database error occurred",
      });
    }
  }),
  // Simplified endpoint for adding emails to waitlist (rate limiting handled by web app)
  addToWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        info("[addToWaitlist] Processing email:", input.email);

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

        info("[addToWaitlist] Successfully added email to waitlist:", input.email);
        return { message: "You've been added to the waitlist!" };
      } catch (error) {
        warn("[addToWaitlist] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to join waitlist",
        });
      }
    }),
}); 