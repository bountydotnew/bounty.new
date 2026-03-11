'use client';

import { use } from 'react';
import { MarkdownContent } from '@/components/bounty/markdown-content';
import CollapsibleText from '@/components/bounty/collapsible-text';
import { BountyDetailContext } from './context';
import { RelevantLinks } from './relevant-links';

/**
 * Strip markdown links and bare URLs from text
 * Since we display links in the RelevantLinks section, we remove them from the content
 */
function stripLinksFromMarkdown(markdown: string): string {
  let stripped = markdown;

  // Remove markdown links: [text](url)
  stripped = stripped.replace(/\[[^\]]+\]\([^)]+\)/g, '');

  // Remove bare URLs (http/https)
  stripped = stripped.replace(/https?:\/\/[^\s\])\}]+/g, '');

  // Clean up extra whitespace
  stripped = stripped.replace(/\s{2,}/g, ' ').trim();

  return stripped;
}

/**
 * BountyDetailContent
 *
 * Displays the bounty description with markdown rendering.
 * Uses the BountyDetailContext to access the description.
 */
export function BountyDetailContent() {
  const context = use(BountyDetailContext);
  if (!context) {
    throw new Error(
      'BountyDetailContent must be used within BountyDetailProvider'
    );
  }

  const { bounty } = context.state;

  if (!bounty.description) {
    return null;
  }

  // Strip links from description since they're shown in RelevantLinks
  const descriptionWithoutLinks = stripLinksFromMarkdown(bounty.description);

  return (
    <div className="mb-8">
      <h2 className="mb-4 font-medium text-foreground text-xl">About</h2>
      <CollapsibleText>
        <MarkdownContent content={descriptionWithoutLinks} />
      </CollapsibleText>
      <RelevantLinks />
    </div>
  );
}
