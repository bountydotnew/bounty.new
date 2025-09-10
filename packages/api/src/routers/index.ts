import { protectedProcedure, publicProcedure, router } from '../trpc';
import { betaApplicationsRouter } from './beta-applications';
import { billingRouter } from './billing';
import { bountiesRouter } from './bounties';
import { earlyAccessRouter } from './early-access';
import { newsRouter } from './news';
import { notificationsRouter } from './notifications';
import { emailsRouter } from './emails';
import { profilesRouter } from './profiles';
import { repositoryRouter } from './repository';
import { userRouter } from './user';

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return {
      message: 'IM ALIVE!!!!',
      timestamp: new Date().toISOString(),
      status: 'healthy',
    };
  }),
  ping: publicProcedure.query(() => {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
      status: 'healthy',
    };
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: 'This is private',
      user: ctx.session?.user,
    };
  }),
  earlyAccess: earlyAccessRouter,
  user: userRouter,
  bounties: bountiesRouter,
  profiles: profilesRouter,
  news: newsRouter,
  notifications: notificationsRouter,
  emails: emailsRouter,
  betaApplications: betaApplicationsRouter,
  repository: repositoryRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
