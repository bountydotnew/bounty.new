"use client";

import type { registry } from "@bounty/api";
import { createRivetKit } from "@rivetkit/next-js/client";

// The endpoint will default to /api/rivet which works for both dev and production
// on Vercel. You can override this with NEXT_PUBLIC_RIVET_ENDPOINT if needed.
export const { useActor } = createRivetKit<typeof registry>({
  ///endpoint: process.env.NEXT_PUBLIC_RIVET_ENDPOINT || '/api/rivet',
  endpoint: "https://api.rivet.dev",
  namespace: "bounty-6c63-production-f233",
  token: "cSWCT0DZsU3oq2lkxDXVkSVR0GOW6geJszGMDpzmJBHavmwIfq6oE0nKZfNkcA4x",
});
