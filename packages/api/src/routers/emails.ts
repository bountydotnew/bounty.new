import { z } from "zod";
import { adminProcedure, router } from "../trpc";
import {
  AUDIENCES,
  FROM_ADDRESSES,
  sendEmail,
  subscribeToAudience,
  unsubscribeFromAudience,
} from "@bounty/email";
import type { AudienceKey, FromKey } from "@bounty/email";
import { grim } from "../lib/use-dev-log";

const fromKeySchema = z.custom<FromKey>(
  (v) => typeof v === "string" && v in FROM_ADDRESSES
);
const audienceKeySchema = z.custom<AudienceKey>(
  (v) => typeof v === "string" && v in AUDIENCES
);

export const emailsRouter = router({
  constants: adminProcedure.query(async () => ({
    from: FROM_ADDRESSES,
    audiences: AUDIENCES,
  })),

  send: adminProcedure
    .input(
      z.object({
        to: z.union([z.string().email(), z.array(z.string().email()).min(1)]),
        subject: z.string().min(1),
        fromKey: fromKeySchema,
        text: z.string().optional(),
        html: z.string().optional(),
        idempotencyKey: z.string().min(1).max(256).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { info } = grim();
      info("email.send", {
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        fromKey: input.fromKey,
        from: FROM_ADDRESSES[input.fromKey],
        hasHtml: Boolean(input.html),
        hasText: Boolean(input.text),
      });
      const res = await sendEmail(
        {
          to: input.to,
          subject: input.subject,
          from: FROM_ADDRESSES[input.fromKey],
          text: input.text,
          html: input.html,
        }/* , { idempotencyKey: input.idempotencyKey } */
      );
      if (res.error) {
        const code =
          res.error.statusCode === 429 ? "TOO_MANY_REQUESTS" :
          res.error.statusCode === 403 ? "FORBIDDEN" :
          res.error.statusCode && res.error.statusCode >= 400 && res.error.statusCode < 500 ? "BAD_REQUEST" :
          "INTERNAL_SERVER_ERROR";
        throw new TRPCError({ code, message: res.error.message });
      }
      const payload = { id: res.data?.id ?? null };
      console.info("email.send.result", payload);
      return { success: true, data: payload };
    }),

  subscribe: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        audienceKey: audienceKeySchema,
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        properties: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await subscribeToAudience({
        email: input.email,
        audience: AUDIENCES[input.audienceKey],
        firstName: input.firstName,
        lastName: input.lastName,
        properties: input.properties,
      });
      return res;
    }),

  unsubscribe: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        audienceKey: audienceKeySchema,
      })
    )
    .mutation(async ({ input }) => {
      const res = await unsubscribeFromAudience({
        email: input.email,
        audience: AUDIENCES[input.audienceKey],
      });
      return res;
    }),
});


