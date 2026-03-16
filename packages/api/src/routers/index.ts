import { withIntrospection } from '@trpc-studio/introspection';
import { protectedProcedure, publicProcedure, router, t } from '../trpc';
import { bountiesRouter } from './bounties';
import { connectRouter } from './connect';
import { earlyAccessRouter } from './early-access';
import { emailsRouter } from './emails';
import { featureVotesRouter } from './feature-votes';
import { githubInstallationRouter } from './github-installation';
import { linearRouter } from './linear';
import { notificationsRouter } from './notifications';
import { onboardingRouter } from './onboarding';
import { organizationRouter } from './organization';
import { profilesRouter } from './profiles';
import { repositoryRouter } from './repository';
import { userRouter } from './user';

const baseRouter = router({
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
  privateData: protectedProcedure.query(() => {
    return {
      message: 'This is private',
    };
  }),
  earlyAccess: earlyAccessRouter,
  user: userRouter,
  bounties: bountiesRouter,
  profiles: profilesRouter,
  notifications: notificationsRouter,
  emails: emailsRouter,
  repository: repositoryRouter,
  githubInstallation: githubInstallationRouter,
  linear: linearRouter,
  connect: connectRouter,
  onboarding: onboardingRouter,
  featureVotes: featureVotesRouter,
  organization: organizationRouter,
});

export const appRouter = withIntrospection(t, baseRouter, {
  enabled: process.env.NODE_ENV === 'development',
});

export type AppRouter = typeof appRouter;
