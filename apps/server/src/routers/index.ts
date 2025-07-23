import {
  protectedProcedure, publicProcedure,
  router,
} from "../lib/trpc";
import { earlyAccessRouter } from "./early-access";
import { userRouter } from "./user";
import { bountiesRouter } from "./bounties";
import { profilesRouter } from "./profiles";
import { newsRouter } from "./news";
import { notificationsRouter } from "./notifications";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return {
      message: "IM ALIVE!!!!",
      timestamp: new Date().toISOString(),
      status: "healthy"
    };
  }),
  ping: publicProcedure.query(() => {
    return {
      message: "pong",
      timestamp: new Date().toISOString(),
      status: "healthy"
    };
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  earlyAccess: earlyAccessRouter,
  user: userRouter,
  bounties: bountiesRouter,
  profiles: profilesRouter,
  news: newsRouter,
  notifications: notificationsRouter,
});
export type AppRouter = typeof appRouter;
