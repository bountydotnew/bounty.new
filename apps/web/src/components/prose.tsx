'use client';

import { cn } from '@bounty/ui/lib/utils';
import type React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

type ProseProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'article';
  html?: string;
  markdown?: string;
};

function Prose({ children, html, markdown, className }: ProseProps) {
  const content = markdown ?? html;

  return (
    <article
      className={cn(
        'prose prose-zinc dark:prose-invert mx-auto max-w-none prose-ol:list-decimal prose-ul:list-disc prose-img:rounded-xl prose-headings:font-semibold prose-a:text-inherit prose-a:underline prose-h1:text-2xl prose-h2:text-xl prose-li:marker:text-muted-foreground',
        className
      )}
    >
      {content ? (
        <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>
          {content}
        </ReactMarkdown>
      ) : (
        children
      )}
    </article>
  );
}

export default Prose;
