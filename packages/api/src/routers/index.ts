import { protectedProcedure, publicProcedure, router } from "../trpc";
import { earlyAccessRouter } from "./early-access";
import { userRouter } from "./user";
import { bountiesRouter } from "./bounties";
import { profilesRouter } from "./profiles";
import { newsRouter } from "./news";
import { notificationsRouter } from "./notifications";
import { betaApplicationsRouter } from "./beta-applications";
import { repositoryRouter } from "./repository";
import { billingRouter } from "./billing";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return {
      message: "IM ALIVE!!!!",
      timestamp: new Date().toISOString(),
      status: "healthy",
    };
  }),
  ping: publicProcedure.query(() => {
    return {
      message: "pong",
      timestamp: new Date().toISOString(),
      status: "healthy",
    };
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session?.user,
    };
  }),
  earlyAccess: earlyAccessRouter,
  user: userRouter,
  bounties: bountiesRouter,
  profiles: profilesRouter,
  news: newsRouter,
  notifications: notificationsRouter,
  betaApplications: betaApplicationsRouter,
  repository: repositoryRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
