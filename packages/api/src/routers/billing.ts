import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Polar } from "@polar-sh/sdk";

const polarEnv =
  process.env.NODE_ENV === "production" ? "production" : "sandbox";
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  server: polarEnv,
});

export const billingRouter = router({
  ensurePolarCustomer: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.session?.user;
    if (!user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const externalId = user.id;

    try {
      await polarClient.customers.getExternal({ externalId });
      return { ok: true } as const;
    } catch (err: any) {
      if (err?.status && err.status !== 404) {
        // proceed to create anyway
      }
      try {
        await polarClient.customers.create({
          external_id: externalId,
          email: user.email ?? undefined,
          name: user.name ?? user.email ?? undefined,
          metadata: { userId: externalId },
        } as any);
        return { ok: true } as const;
      } catch (createErr: any) {
        const msg = String(
          createErr?.message || createErr?.body$ || createErr?.detail || "",
        );
        if (
          createErr?.status === 409 ||
          msg.includes("external ID cannot be updated") ||
          msg.toLowerCase().includes("external_id cannot be updated") ||
          msg.includes('"error":"PolarRequestValidationError"')
        ) {
          return { ok: true } as const;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to ensure Polar customer",
          cause: createErr,
        });
      }
    }
  }),
});
