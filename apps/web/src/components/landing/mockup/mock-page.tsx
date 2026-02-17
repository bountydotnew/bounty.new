"use client";

import type { ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { useMockBrowser } from './mock-browser-context';

interface MockPageProps {
  url: string;
  children: ReactNode;
}

export function MockPage({ url, children }: MockPageProps) {
  const { currentUrl } = useMockBrowser();
  const isActive = currentUrl === url;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <m.div
          key={url}
          initial={{ opacity: 0, y: 8, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.998 }}
          transition={{
            duration: 0.35,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="absolute inset-0 overflow-auto"
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
