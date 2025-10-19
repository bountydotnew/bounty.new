'use client';

import type { Registry } from '@bounty/api';
import { createRivetKit } from 'rivetkit';

// The endpoint will default to /api/rivet which works for both dev and production
// on Vercel. You can override this with NEXT_PUBLIC_RIVET_ENDPOINT if needed.
export const rivet = createRivetKit<Registry>(
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_RIVET_ENDPOINT || '/api/rivet')
    : '/api/rivet'
);
