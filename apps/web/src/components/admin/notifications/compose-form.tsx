'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ComposeFormProps {
  count: number;
  title: string;
  message: string;
  linkTo: string;
  isSending: boolean;
  onTitle: (v: string) => void;
  onMessage: (v: string) => void;
  onLinkTo: (v: string) => void;
  onSend: () => void;
}

export function ComposeForm({
  count,
  title,
  message,
  linkTo,
  isSending,
  onTitle,
  onMessage,
  onLinkTo,
  onSend,
}: ComposeFormProps) {
  const canSend =
    count > 0 && title.trim().length > 0 && message.trim().length > 0;
  return (
    <div className="space-y-4">
      <Input
        className="border-neutral-800 bg-neutral-900"
        onChange={(e) => onTitle(e.target.value)}
        placeholder="Title"
        value={title}
      />
      <Textarea
        className="border-neutral-800 bg-neutral-900"
        onChange={(e) => onMessage(e.target.value)}
        placeholder="Message"
        value={message}
      />
      <Input
        className="border-neutral-800 bg-neutral-900"
        onChange={(e) => onLinkTo(e.target.value)}
        placeholder="Optional link (e.g. /bounties)"
        value={linkTo}
      />
      <div className="flex items-center justify-between">
        <div className="text-neutral-500 text-xs">Selected: {count}</div>
        <Button disabled={!canSend || isSending} onClick={onSend}>
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
