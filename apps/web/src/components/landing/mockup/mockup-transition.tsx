"use client";

import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface MockupTransitionProps {
  transitionKey: string;
  children: ReactNode;
}

export function MockupTransition({ transitionKey, children }: MockupTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.45, ease: [0.2, 0.6, 0.2, 1] }}
        className="absolute inset-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
