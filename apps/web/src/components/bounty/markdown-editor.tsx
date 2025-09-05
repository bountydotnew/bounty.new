'use client';

import { Edit, Eye, Split } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
import { MarkdownContent } from '@/components/bounty/markdown-content';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MarkdownTextareaProps
  extends Omit<React.ComponentProps<'textarea'>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-16 w-full rounded-md border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      data-slot="textarea"
      {...props}
    />
  );
}

export function MarkdownTextarea({
  value = '',
  onChange,
  placeholder = 'Write your markdown here...',
  className,
  ...props
}: MarkdownTextareaProps) {
  const [content, setContent] = useState(value);
  const [mode, setMode] = useState<'write' | 'preview' | 'split'>('write');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    onChange?.(newValue);
  };

  React.useEffect(() => {
    setContent(value);
  }, [value]);

  return (
    <div className={cn('overflow-hidden rounded-md border', className)}>
      <div className="flex items-center justify-between border-b bg-muted/30">
        <div className="flex items-center">
          <Button
            className="rounded-none"
            onClick={() => setMode('write')}
            size="sm"
            type="button"
            variant={mode === 'write' ? 'default' : 'text'}
          >
            <Edit className="mr-1 h-4 w-4" />
            Write
          </Button>
          <Button
            className="rounded-none"
            onClick={() => setMode('preview')}
            size="sm"
            type="button"
            variant={mode === 'preview' ? 'default' : 'text'}
          >
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button
            className="rounded-none"
            onClick={() => setMode('split')}
            size="sm"
            type="button"
            variant={mode === 'split' ? 'default' : 'text'}
          >
            <Split className="mr-1 h-4 w-4" />
            Split
          </Button>
        </div>
      </div>

      <div className="h-[200px]">
        {mode === 'write' && (
          <Textarea
            className="h-full resize-none overflow-y-auto rounded-none border-0 p-2"
            onChange={handleChange}
            placeholder={placeholder}
            value={content}
            {...props}
          />
        )}

        {mode === 'preview' && (
          <div
            aria-label="Markdown preview"
            className="h-full overflow-y-auto border-0 p-2"
            role="region"
          >
            <MarkdownContent content={content} />
          </div>
        )}

        {mode === 'split' && (
          <div className="grid h-full min-w-0 grid-cols-2">
            <div className="min-w-0 border-r">
              <Textarea
                className="h-full resize-none overflow-y-auto rounded-none border-0 p-2"
                onChange={handleChange}
                placeholder={placeholder}
                value={content}
                {...props}
              />
            </div>
            <div className="h-full min-w-0 overflow-y-auto break-words p-2">
              <MarkdownContent content={content} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
