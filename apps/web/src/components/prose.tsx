import { cn } from '@/lib/utils';
import React from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

type ProseProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'article';
  html?: string;
  markdown?: string;
};

async function renderMarkdownToHtml(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(md);
  return String(file);
}

function Prose({ children, html, markdown, className }: ProseProps) {
  const [rendered, setRendered] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    if (markdown) {
      renderMarkdownToHtml(markdown).then((out) => {
        if (active) setRendered(out);
      });
    } else if (html) {
      setRendered(html);
    } else {
      setRendered(null);
    }
    return () => {
      active = false;
    };
  }, [markdown, html]);

  return (
    <article
      className={cn(
        'prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-muted-foreground prose-img:rounded-xl mx-auto',
        className
      )}
    >
      {rendered ? <div dangerouslySetInnerHTML={{ __html: rendered }} /> : children}
    </article>
  );
}

export default Prose;
