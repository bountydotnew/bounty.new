'use client';

import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';

interface CollapsibleTextProps {
  children: React.ReactNode;
  collapsedHeight?: number;
  buttonLabel?: string;
}

export default function CollapsibleText({
  children,
  collapsedHeight = 160,
  buttonLabel = 'Show more',
}: CollapsibleTextProps) {
  const isMobile = useMediaQuery('(max-width: 1280px)');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isCollapsible, setIsCollapsible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!isMobile) {
      setIsCollapsible(false);
      setExpanded(true);
      setMaxHeight(null);
      return;
    }
    const el = contentRef.current;
    if (!el) {
      return;
    }
    const full = el.scrollHeight;
    if (full > collapsedHeight) {
      setIsCollapsible(true);
      setExpanded(false);
      setMaxHeight(collapsedHeight);
    } else {
      setIsCollapsible(false);
      setExpanded(true);
      setMaxHeight(null);
    }
  }, [isMobile, collapsedHeight]);

  const handleExpand = () => {
    const el = contentRef.current;
    if (!el) {
      return;
    }
    const full = el.scrollHeight;
    setExpanded(true);
    setMaxHeight(full);
    window.setTimeout(() => setMaxHeight(null), 320);
  };

  return (
    <div className="relative">
      <div
        className={
          'overflow-hidden transition-[max-height] duration-300 ease-out'
        }
        style={{ maxHeight: maxHeight === null ? undefined : maxHeight }}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      {isCollapsible && !expanded && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
            style={{
              background:
                'linear-gradient(to top, rgba(29,29,29,0.98) 0%, rgba(29,29,29,0.96) 28%, rgba(29,29,29,0.9) 56%, rgba(29,29,29,0.78) 78%, rgba(29,29,29,0.0) 100%)',
            }}
          />
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <button
              aria-expanded={expanded}
              className="flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800/40 px-2 py-0.5 text-[11px] text-neutral-300 hover:bg-neutral-700/40"
              onClick={handleExpand}
            >
              {buttonLabel}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
