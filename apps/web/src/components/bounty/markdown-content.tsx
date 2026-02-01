import Link from '@bounty/ui/components/link';
import { Base64 } from 'js-base64';
import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';

// Custom sanitize schema that allows images from external sources
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [
      ...(defaultSchema.attributes?.img || []),
      'src',
      'alt',
      'title',
      'width',
      'height',
      'className',
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'img',
  ],
};

interface MarkdownContentProps {
  content: string;
  encoding?: 'base64' | 'utf8';
}

function decodeBase64Content(content: string): string {
  try {
    return Base64.decode(content);
  } catch (_error) {
    return 'Error: Unable to decode content. The file may be corrupted or not properly encoded.';
  }
}

interface CopyButtonProps {
  text: string;
}

function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      // Clipboard API may fail in some contexts, silently ignore
    }
  };

  return (
    <button
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
      className="rounded bg-neutral-800 p-1.5 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-foreground"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      type="button"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mt-0 mb-4 font-bold text-2xl text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 font-semibold text-foreground text-xl">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 font-medium text-lg text-foreground">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 mb-2 font-medium text-base text-foreground">{children}</h4>
  ),
  p: ({ children }) => {
    const containsOnlyImages = React.Children.toArray(children).every(
      (child) => React.isValidElement(child) && child.type === 'img'
    );

    if (containsOnlyImages) {
      return (
        <p className="mb-4 flex flex-wrap justify-center gap-2 text-neutral-300 leading-relaxed">
          {children}
        </p>
      );
    }

    return <p className="mb-4 text-neutral-300 leading-relaxed">{children}</p>;
  },
  ul: ({ children }) => {
    return (
      <ul className="mb-4 ml-5 list-outside list-disc space-y-1 text-neutral-300">
        {children}
      </ul>
    );
  },
  ol: ({ children }) => {
    return (
      <ol className="mb-4 ml-5 list-outside list-decimal space-y-1 text-neutral-300">
        {children}
      </ol>
    );
  },
  li: ({ children }) => {
    return <li className="pl-1 text-neutral-300">{children}</li>;
  },
  a: ({ href, children }) => (
    <Link
      className="text-blue-400 underline hover:text-blue-300"
      href={href || '#'}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </Link>
  ),
  img: ({ src, alt, ...props }) => {
    // Convert Blob to data URL if needed, otherwise use string
    const srcString =
      typeof src === 'string'
        ? src
        : src instanceof Blob
          ? URL.createObjectURL(src)
          : '';

    // Check if this is an external image (from Linear, GitHub, etc.)
    const isExternalImage = typeof srcString === 'string' && (
      srcString.startsWith('http://') ||
      srcString.startsWith('https://')
    );

    // For external images, use regular img tag to avoid Next.js optimization issues
    if (isExternalImage) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt || ''}
          src={srcString}
          {...props}
          className="my-3 inline-block h-auto max-w-full max-h-[400px] object-contain border-neutral-800 dark:border-neutral-700 rounded"
        />
      );
    }

    // For data URLs and other sources, use Next.js Image
    return (
      <Image
        alt={alt || ''}
        src={srcString}
        width={800}
        height={400}
        className="my-3 inline-block h-auto max-w-full max-h-[400px] object-contain border-neutral-800 dark:border-neutral-700 rounded"
        unoptimized
      />
    );
  },
  pre: ({ children }) => {
    const extractTextFromChildren = (children: React.ReactNode): string => {
      if (!children) {
        return '';
      }
      if (typeof children === 'string') {
        return children;
      }
      if (Array.isArray(children)) {
        return children.map(extractTextFromChildren).join('');
      }
      if (React.isValidElement(children)) {
        const element = children as React.ReactElement<{
          children?: React.ReactNode;
        }>;
        return extractTextFromChildren(element.props.children);
      }
      return String(children);
    };
    const codeText = extractTextFromChildren(children);

    return (
      <div className="relative my-3 border border-neutral-700 bg-neutral-900 p-2">
        <div className="flex flex-row">
          <pre className="m-0 w-full overflow-x-auto whitespace-pre pr-10">
            {children}
          </pre>
          <div className="absolute inset-y-0 right-2 flex items-center">
            <CopyButton text={codeText} />
          </div>
        </div>
      </div>
    );
  },
  code: ({ children, className }) => {
    const isInline = !className;
    return isInline ? (
      <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-200 text-sm">
        {children}
      </code>
    ) : (
      <code className={`${className || ''} whitespace-pre font-mono`}>
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-neutral-600 border-l-4 pl-4 text-neutral-400 italic">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <table className="my-4 w-full border-collapse border border-neutral-800">
      {children}
    </table>
  ),
  th: ({ children }) => (
    <th className="border border-neutral-800 bg-neutral-900 px-4 py-2 text-left font-medium text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-neutral-800 px-4 py-2 text-neutral-300">
      {children}
    </td>
  ),
  hr: () => <hr className="my-6 border-neutral-700" />,
};

export function MarkdownContent({ content, encoding }: MarkdownContentProps) {
  const decodedContent =
    encoding === 'base64' ? decodeBase64Content(content) : content;

  return (
    <div className="prose prose-invert prose-neutral markdown-content max-w-none">
      {/* eslint-disable-next-line react/no-danger */}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: CSS styles need to be injected for markdown content */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .markdown-content ul ul,
        .markdown-content ol ol,
        .markdown-content ul ol,
        .markdown-content ol ul {
          margin-left: 2rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .markdown-content pre {
          white-space: pre-wrap !important;
          position: relative !important;
        }
        .markdown-content pre code {
          display: block !important;
          overflow-x: auto !important;
          padding: 0.5rem !important;
          white-space: pre !important;
        }
        .markdown-content li > p {
          margin-bottom: 0.25rem !important;
          display: inline-block !important;
        }
        .markdown-content li > ul,
        .markdown-content li > ol {
          margin-top: 0.25rem !important;
        }
        .markdown-content code {
          white-space: pre !important;
        }
        .markdown-content ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
        }
        .markdown-content ol {
          list-style-type: decimal !important;
          list-style-position: outside !important;
        }
        .markdown-content ul ul {
          list-style-type: circle !important;
        }
        .markdown-content ul ul ul {
          list-style-type: square !important;
        }
      `,
        }}
      />
      <ReactMarkdown
        components={markdownComponents}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        remarkPlugins={[remarkGfm]}
      >
        {decodedContent}
      </ReactMarkdown>
    </div>
  );
}
