'use client';

import { ArrowLeft, ArrowRight, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { HeaderBase } from '@/components/sections/home/header-base';
import { Button } from '@/components/ui/button';
import type { StoredDraft } from '@/hooks/use-drafts';

interface DraftNavigatorProps {
  drafts: StoredDraft[];
  onPreviewDraft: (draft: StoredDraft) => void;
  onLoadDraft: (draft: StoredDraft) => void;
  onClose: () => void;
}

export function DraftNavigator({
  drafts,
  onPreviewDraft,
  onLoadDraft,
  onClose,
}: DraftNavigatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (drafts.length === 0) {
    return null;
  }

  const currentDraft = drafts[currentIndex];
  const hasMultiple = drafts.length > 1;

  const navigatePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : drafts.length - 1;
    setCurrentIndex(newIndex);
    onPreviewDraft(drafts[newIndex]);
  };

  const navigateNext = () => {
    const newIndex = currentIndex < drafts.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    onPreviewDraft(drafts[newIndex]);
  };

  const leftContent = (
    <div className="flex items-center gap-3">
      <FileText className="h-4 w-4 text-primary" />
      {!isCollapsed && (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {hasMultiple
              ? `Draft ${currentIndex + 1} of ${drafts.length}`
              : 'Draft Found'}
          </span>
          <span className="max-w-48 truncate text-muted-foreground text-xs">
            {currentDraft.title || 'Untitled Draft'}
          </span>
        </div>
      )}
      {isCollapsed && (
        <span className="font-medium text-sm">
          {hasMultiple ? `${currentIndex + 1}/${drafts.length}` : 'Draft'}
        </span>
      )}
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-1">
      {!isCollapsed && hasMultiple && (
        <>
          <Button
            className="h-7 w-7 p-0"
            onClick={navigatePrevious}
            size="sm"
            variant="outline"
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
          <Button
            className="h-7 w-7 p-0"
            onClick={navigateNext}
            size="sm"
            variant="outline"
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
        </>
      )}
      {!isCollapsed && (
        <Button
          className="ml-2 h-7 text-xs"
          onClick={() => onLoadDraft(currentDraft)}
          size="sm"
        >
          Load Draft
        </Button>
      )}
      <Button
        className="ml-1 h-7 w-7 p-0"
        onClick={() => setIsCollapsed(!isCollapsed)}
        size="sm"
        variant="outline"
      >
        {isCollapsed ? (
          <ArrowLeft className="h-3 w-3" />
        ) : (
          <ArrowRight className="h-3 w-3" />
        )}
      </Button>
      <Button
        className="h-7 w-7 p-0"
        onClick={onClose}
        size="sm"
        variant="outline"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="fixed right-0 bottom-0 z-30 w-full p-2 md:w-[calc(100%-var(--sidebar-width))]">
      <HeaderBase
        className={`mx-auto max-w-4xl rounded-xl border border-white/10 bg-[#1D1D1D]/90 pr-2 pl-3 backdrop-blur-sm transition-all duration-200 ${
          isCollapsed ? 'h-10' : 'h-12'
        }`}
        leftContent={leftContent}
        rightContent={rightContent}
      />
    </div>
  );
}
