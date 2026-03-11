'use client';

import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { useEffect, useRef, useReducer } from 'react';

interface CollapsibleTextProps {
  children: React.ReactNode;
  collapsedHeight?: number;
  buttonLabel?: string;
}

type CollapseState = {
  isCollapsible: boolean;
  expanded: boolean;
  maxHeight: number | null;
};

type CollapseAction =
  | { type: 'RESET' }
  | { type: 'SET_COLLAPSIBLE'; maxHeight: number }
  | { type: 'SET_NOT_COLLAPSIBLE' }
  | { type: 'EXPAND'; fullHeight: number }
  | { type: 'CLEAR_MAX_HEIGHT' };

function collapseReducer(
  state: CollapseState,
  action: CollapseAction
): CollapseState {
  switch (action.type) {
    case 'RESET':
      return { isCollapsible: false, expanded: true, maxHeight: null };
    case 'SET_COLLAPSIBLE':
      return {
        isCollapsible: true,
        expanded: false,
        maxHeight: action.maxHeight,
      };
    case 'SET_NOT_COLLAPSIBLE':
      return { isCollapsible: false, expanded: true, maxHeight: null };
    case 'EXPAND':
      return { ...state, expanded: true, maxHeight: action.fullHeight };
    case 'CLEAR_MAX_HEIGHT':
      return { ...state, maxHeight: null };
    default:
      return state;
  }
}

export default function CollapsibleText({
  children,
  collapsedHeight = 160,
  buttonLabel = 'Show more',
}: CollapsibleTextProps) {
  const isMobile = useMediaQuery('(max-width: 1280px)');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [collapseState, dispatch] = useReducer(collapseReducer, {
    isCollapsible: false,
    expanded: false,
    maxHeight: null,
  });

  useEffect(() => {
    if (!isMobile) {
      dispatch({ type: 'RESET' });
      return;
    }
    const el = contentRef.current;
    if (!el) {
      return;
    }
    const full = el.scrollHeight;
    if (full > collapsedHeight) {
      dispatch({ type: 'SET_COLLAPSIBLE', maxHeight: collapsedHeight });
    } else {
      dispatch({ type: 'SET_NOT_COLLAPSIBLE' });
    }
  }, [isMobile, collapsedHeight]);

  const handleExpand = () => {
    const el = contentRef.current;
    if (!el) {
      return;
    }
    const full = el.scrollHeight;
    dispatch({ type: 'EXPAND', fullHeight: full });
    window.setTimeout(() => dispatch({ type: 'CLEAR_MAX_HEIGHT' }), 320);
  };

  return (
    <div className="relative">
      <div
        className={
          'overflow-hidden transition-[max-height] duration-300 ease-out'
        }
        style={{
          maxHeight:
            collapseState.maxHeight === null
              ? undefined
              : collapseState.maxHeight,
        }}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      {collapseState.isCollapsible && !collapseState.expanded && (
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
              aria-expanded={collapseState.expanded}
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
