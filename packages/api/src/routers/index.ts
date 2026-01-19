import { protectedProcedure, publicProcedure, router } from '../trpc';
import { bountiesRouter } from './bounties';
import { connectRouter } from './connect';
import { earlyAccessRouter } from './early-access';
import { emailsRouter } from './emails';
import { githubInstallationRouter } from './github-installation';
import { newsRouter } from './news';
import { notificationsRouter } from './notifications';
import { onboardingRouter } from './onboarding';
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
  repository: repositoryRouter,
  githubInstallation: githubInstallationRouter,
  connect: connectRouter,
  onboarding: onboardingRouter,
});

export type AppRouter = typeof appRouter;
