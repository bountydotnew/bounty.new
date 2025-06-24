import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { user } from "../db/schema/auth";
import { protectedProcedure, router } from "../lib/trpc";

export const userRouter = router({
  hasAccess: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const userRecord = await db
      .select({ hasAccess: user.hasAccess })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      hasAccess: userRecord[0].hasAccess,
    };
  }),
  
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return userRecord[0];
  }),
}); 