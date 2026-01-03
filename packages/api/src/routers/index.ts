import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { billingRouter } from './billing';
import { bountiesRouter } from './bounties';
import { connectRouter } from './connect';
import { earlyAccessRouter } from './early-access';
import { emailsRouter } from './emails';
import { newsRouter } from './news';
import { notificationsRouter } from './notifications';
import { profilesRouter } from './profiles';
import { repositoryRouter } from './repository';
import { userRouter } from './user';

const healthCheckOutputSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
  status: z.string(),
});

export const appRouter = router({
  healthCheck: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/health',
        summary: 'Health check endpoint',
        description: 'Returns the health status of the API',
        tags: ['Health'],
      },
    })
    .input(z.void())
    .output(healthCheckOutputSchema)
    .query(() => {
      return {
        message: 'IM ALIVE!!!!',
        timestamp: new Date().toISOString(),
        status: 'healthy',
      };
    }),
  ping: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/ping',
        summary: 'Ping endpoint',
        description: 'Simple ping/pong endpoint to verify API connectivity',
        tags: ['Health'],
      },
    })
    .input(z.void())
    .output(healthCheckOutputSchema)
    .query(() => {
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
  billing: billingRouter,
  connect: connectRouter,
});

export type AppRouter = typeof appRouter;
