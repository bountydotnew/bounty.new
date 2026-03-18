'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { trpcClient } from '@/utils/trpc';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@bounty/ui/components/dialog';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import { Mail } from 'lucide-react';
import { Spinner } from '@bounty/ui/components/spinner';

// ---------------------------------------------------------------------------
// Create Invite Dialog — manual email entry for arbitrary invites
// ---------------------------------------------------------------------------

interface CreateInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInviteDialog({
  open,
  onOpenChange,
}: CreateInviteDialogProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: (targetEmail: string) =>
      trpcClient.earlyAccess.generateInviteCode.mutate({ email: targetEmail }),
    onSuccess: (_data, targetEmail) => {
      toast.success(`Invite sent to ${targetEmail}`);
      setSent(true);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invite');
    },
  });

  const handleSend = () => {
    if (!email.trim()) return;
    mutation.mutate(email.trim());
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    mutation.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create invite</DialogTitle>
          <DialogDescription>
            Enter an email address to generate and send an invite code. Upon
            entering a valid code, they will be granted early access.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="px-4 py-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <Mail className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Invite sent</p>
            <p className="mt-1 text-xs text-text-muted">
              A code has been emailed to {email}
            </p>
          </div>
        ) : (
          <div className="px-4 py-2">
            <label
              htmlFor="invite-email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Email address
            </label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder="user@example.com"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') handleSend();
              }}
            />
          </div>
        )}

        <DialogFooter>
          <DialogClose>
            <Button variant="outline">{sent ? 'Done' : 'Cancel'}</Button>
          </DialogClose>
          {!sent && (
            <Button
              onClick={handleSend}
              disabled={!email.trim() || mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Spinner className="h-4 w-4" size="sm" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" />
                  Send invite
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Send Invite Confirm Dialog — pre-filled email from user row, no editable input
// ---------------------------------------------------------------------------

interface SendInviteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export function SendInviteConfirmDialog({
  open,
  onOpenChange,
  email,
}: SendInviteConfirmDialogProps) {
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      trpcClient.earlyAccess.generateInviteCode.mutate({ email }),
    onSuccess: () => {
      toast.success(`Invite sent to ${email}`);
      setSent(true);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invite');
    },
  });

  const handleClose = () => {
    setSent(false); // Reset sent state when dialog closes
    mutation.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send invite code</DialogTitle>
          <DialogDescription>
            An invite code will be generated and emailed to this user.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="px-4 py-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <Mail className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Invite sent</p>
            <p className="mt-1 text-xs text-text-muted">
              A code has been emailed to {email}
            </p>
          </div>
        ) : (
          <div className="px-4 py-3">
            <p className="text-sm text-foreground">
              Send an invite code to{' '}
              <span className="font-medium">{email}</span>?
            </p>
          </div>
        )}

        <DialogFooter>
          <DialogClose>
            <Button variant="outline">{sent ? 'Done' : 'Cancel'}</Button>
          </DialogClose>
          {!sent && (
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Spinner className="h-4 w-4" size="sm" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5" />
                  Send invite
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
