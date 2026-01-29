'use client';

import { use } from 'react';
import { MarkdownContent } from '@/components/bounty/markdown-content';
import CollapsibleText from '@/components/bounty/collapsible-text';
import { BountyDetailContext } from './context';

/**
 * BountyDetailContent
 *
 * Displays the bounty description with markdown rendering.
 * Uses the BountyDetailContext to access the description.
 */
export function BountyDetailContent() {
  const context = use(BountyDetailContext);
  if (!context) {
    throw new Error('BountyDetailContent must be used within BountyDetailProvider');
  }

  const { bounty } = context.state;

  if (!bounty.description) {
    return null;
  }

  return (
    <div className="mb-8 rounded-lg border border-[#383838]/20 bg-[#1D1D1D] p-6">
      <h2 className="mb-4 font-medium text-white text-xl">About</h2>
      <CollapsibleText>
        <MarkdownContent content={bounty.description} />
      </CollapsibleText>
    </div>
  );
}
