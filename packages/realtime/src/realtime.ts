import { Realtime, type InferRealtimeEvents } from '@upstash/realtime';
import { redis } from './redis';
import { z } from 'zod';

const schema = {
  notifications: {
    refresh: z.object({ userId: z.string(), ts: z.number() }),
  },
};

export const realtime = new Realtime({ schema, redis });
export type RealtimeEvents = InferRealtimeEvents<typeof realtime>;
