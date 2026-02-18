'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useMockBrowser } from './mock-browser-context';

export function MockLoadingBar() {
  const { isNavigating, loadingProgress } = useMockBrowser();

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          animate={{ opacity: 1 }}
          className="absolute top-0 right-0 left-0 z-50 h-[3px] overflow-hidden bg-surface-1"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Main progress bar */}
          <motion.div
            animate={{ width: `${loadingProgress}%` }}
            className="relative h-full bg-info"
            initial={{ width: '0%' }}
            transition={{
              duration: 0.1,
              ease: 'easeOut',
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
            />
            {/* Glow effect at the end */}
            <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-info blur-sm" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
