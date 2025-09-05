'use client';

import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Textarea } from '@bounty/ui/components/textarea';

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

export function ComposeForm({ count, title, message, linkTo, isSending, onTitle, onMessage, onLinkTo, onSend }: ComposeFormProps) {
  const canSend = count > 0 && title.trim().length > 0 && message.trim().length > 0;
  return (
    <div className="space-y-4">
      <Input className="border-neutral-800 bg-neutral-900" placeholder="Title" value={title} onChange={(e) => onTitle(e.target.value)} />
      <Textarea className="border-neutral-800 bg-neutral-900" placeholder="Message" value={message} onChange={(e) => onMessage(e.target.value)} />
      <Input className="border-neutral-800 bg-neutral-900" placeholder="Optional link (e.g. /bounties)" value={linkTo} onChange={(e) => onLinkTo(e.target.value)} />
      <div className="flex items-center justify-between">
        <div className="text-neutral-500 text-xs">Selected: {count}</div>
        <Button disabled={!canSend || isSending} onClick={onSend}>{isSending ? 'Sending...' : 'Send'}</Button>
      </div>
    </div>
  );
}


