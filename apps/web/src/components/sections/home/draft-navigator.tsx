"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, FileText, X } from "lucide-react";
import { HeaderBase } from "@/components/sections/home/header-base";
import { StoredDraft } from "@/hooks/use-drafts";

interface DraftNavigatorProps {
  drafts: StoredDraft[];
  onPreviewDraft: (draft: StoredDraft) => void;
  onLoadDraft: (draft: StoredDraft) => void;
  onClose: () => void;
}

export function DraftNavigator({ drafts, onPreviewDraft, onLoadDraft, onClose }: DraftNavigatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  if (drafts.length === 0) return null;

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
          <span className="text-sm font-medium">
            {hasMultiple ? `Draft ${currentIndex + 1} of ${drafts.length}` : "Draft Found"}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-48">
            {currentDraft.title || "Untitled Draft"}
          </span>
        </div>
      )}
      {isCollapsed && (
        <span className="text-sm font-medium">
          {hasMultiple ? `${currentIndex + 1}/${drafts.length}` : "Draft"}
        </span>
      )}
    </div>
  );

  const rightContent = (
    <div className="flex items-center gap-1">
      {!isCollapsed && hasMultiple && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={navigatePrevious}
            className="h-7 w-7 p-0"
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateNext}
            className="h-7 w-7 p-0"
          >
            <ArrowRight className="h-3 w-3" />
          </Button>
        </>
      )}
      {!isCollapsed && (
        <Button
          size="sm"
          onClick={() => onLoadDraft(currentDraft)}
          className="ml-2 h-7 text-xs"
        >
          Load Draft
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="h-7 w-7 p-0 ml-1"
      >
        {isCollapsed ? <ArrowLeft className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onClose}
        className="h-7 w-7 p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="fixed bottom-0 right-0 z-30 w-full md:w-[calc(100%-var(--sidebar-width))] p-2">
      <HeaderBase
        className={`bg-[#1D1D1D]/90 backdrop-blur-sm border border-white/10 rounded-xl max-w-4xl mx-auto transition-all duration-200 pl-3 pr-2 ${
          isCollapsed ? 'h-10' : 'h-12'
        }`}
        leftContent={leftContent}
        rightContent={rightContent}
      />
    </div>
  );
} 