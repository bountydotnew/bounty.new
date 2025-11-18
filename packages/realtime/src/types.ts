import type { InferRealtimeEvents } from '@upstash/realtime';
import { z } from 'zod';

// Client-safe schema (matches server schema)
const schema = {
  notifications: {
    refresh: z.object({ userId: z.string(), ts: z.number() }),
  },
};

// Export type without importing server code
export type RealtimeEvents = InferRealtimeEvents<typeof schema>;

