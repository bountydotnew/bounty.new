'use client';

import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@bounty/ui/components/dialog';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { useMutation } from '@tanstack/react-query';
import { Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/utils/trpc';

export function ExternalInviteModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');

  const inviteExternalMutation = useMutation({
    ...trpc.user.inviteExternalUser.mutationOptions({}),
    onSuccess: () => {
      toast.success(`Invite sent to ${email}`);
      setEmail('');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to send invite: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    inviteExternalMutation.mutate({ email });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Mail className="mr-1 h-3 w-3" />
          Invite New User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              type="email"
              value={email}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={inviteExternalMutation.isPending} type="submit">
              {inviteExternalMutation.isPending ? (
                <>
                  <Send className="mr-1 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-1 h-3 w-3" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
