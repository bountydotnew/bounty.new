import { cn } from '@/lib/utils';
import React from 'react';

type ProseProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'article';
  html: string;
};

function Prose({ children, html, className }: ProseProps) {
  return (
    <article
      className={cn(
        'prose prose-h1:font-bold prose-h1:text-xl prose-a:text-blue-600 prose-p:text-justify prose-img:rounded-xl prose-headings:font-serif prose-headings:font-normal mx-auto',
        className
      )}
    >
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : children}
    </article>
  );
}

export default Prose;
