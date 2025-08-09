import { auth } from "./server";
import { Polar } from "@polar-sh/sdk";

const polarEnv = process.env.NODE_ENV === "production" ? "production" : "sandbox";
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  server: polarEnv,
});

export const customerEnsure = auth.createRoute({
  method: "POST",
  path: "/api/auth/customer/ensure",
  handler: async (ctx: any) => {
    const externalId = ctx?.auth?.user?.id as string | undefined;
    if (!externalId) return ctx.json({ ok: false, error: "unauthorized" }, 401);
    try {
      await polarClient.customers.getExternal({ externalId });
      return ctx.json({ ok: true });
    } catch (err: any) {
      if (err?.status && err.status !== 404) {
        console.warn(`[polar:ensure] env=${polarEnv} externalId=${externalId} getExternal status=${err?.status}`);
      }
      try {
        await polarClient.customers.create({
          external_id: externalId,
          email: ctx?.auth?.user?.email,
          name: ctx?.auth?.user?.name ?? ctx?.auth?.user?.email,
          metadata: { userId: externalId },
        } as any);
      } catch (createErr: any) {
        const msg = String(createErr?.message || createErr?.body$ || "");
        if (createErr?.status === 409 || msg.includes("external ID cannot be updated") || msg.toLowerCase().includes("external_id cannot be updated")) {
          return ctx.json({ ok: true });
        }
        throw createErr;
      }
      return ctx.json({ ok: true });
    }
  },
});
