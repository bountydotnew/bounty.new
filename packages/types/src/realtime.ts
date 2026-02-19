import { z } from "zod";

export const realtimeSchema = {
	notifications: {
		refresh: z.object({ userId: z.string(), ts: z.number() }),
	},
} as const;

export type RealtimeSchema = typeof realtimeSchema;

export type RealtimeEvents = {
	notifications: {
		refresh: z.infer<typeof realtimeSchema.notifications.refresh>;
	};
};
