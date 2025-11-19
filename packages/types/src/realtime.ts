import { z } from 'zod';

// Client-safe schema (matches server schema)
const schema = {
  notifications: {
    refresh: z.object({ userId: z.string(), ts: z.number() }),
  },
} as const;

// Manually define the type structure to match InferRealtimeEvents
export type RealtimeEvents = {
  notifications: {
    refresh: z.infer<typeof schema.notifications.refresh>;
  };
};

