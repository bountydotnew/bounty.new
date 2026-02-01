"use client";

import { AnimatePresence, motion } from 'motion/react';
import { useMockBrowser } from './mock-browser-context';

export function MockLoadingBar() {
  const { isNavigating, loadingProgress } = useMockBrowser();

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-[3px] z-50 overflow-hidden bg-surface-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Main progress bar */}
          <motion.div
            className="h-full bg-info relative"
            initial={{ width: '0%' }}
            animate={{ width: `${loadingProgress}%` }}
            transition={{
              duration: 0.1,
              ease: 'easeOut',
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
            />
            {/* Glow effect at the end */}
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-info blur-sm" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
