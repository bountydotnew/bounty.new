'use client';

import type { registry } from '@bounty/api';
import { createRivetKit } from '@rivetkit/next-js/client';

// The endpoint will default to /api/rivet which works for both dev and production
// on Vercel. You can override this with NEXT_PUBLIC_RIVET_ENDPOINT if needed.
export const { useActor } = createRivetKit<typeof registry>({
  endpoint: process.env.NEXT_PUBLIC_RIVET_ENDPOINT || '/api/rivet',
});
