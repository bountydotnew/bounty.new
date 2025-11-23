'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ConfettiState {
  shouldCelebrate: boolean;
  celebrate: () => void;
  reset: () => void;
}

export const useConfettiStore = create<ConfettiState>()(
  devtools(
    (set) => ({
      shouldCelebrate: false,
      celebrate: () => set({ shouldCelebrate: true }),
      reset: () => set({ shouldCelebrate: false }),
    }),
    { name: 'confetti-store' }
  )
);
