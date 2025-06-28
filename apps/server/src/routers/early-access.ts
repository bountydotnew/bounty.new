import { TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db";
import { waitlist } from "../db/schema/auth";
import { publicProcedure, router } from "../lib/trpc";

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
    .mutation(async ({ input }) => {
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
    }),
}); 