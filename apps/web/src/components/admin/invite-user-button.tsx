'use client';

import { Button } from '@bounty/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AccessStage } from '@/types/access';
import { trpc } from '@/utils/trpc';

const ACCESS_STAGES: {
  value: AccessStage;
  label: string;
  description: string;
}[] = [
  { value: 'alpha', label: 'Alpha', description: 'Early testing access' },
  { value: 'beta', label: 'Beta', description: 'Beta testing access' },
  {
    value: 'production',
    label: 'Production',
    description: 'Full platform access',
  },
  { value: 'none', label: 'None', description: 'No access' },
];

interface InviteUserButtonProps {
  userId: string;
  userEmail: string;
  userName: string;
  currentAccessStage?: AccessStage;
}

export function InviteUserButton({
  userId,
  userEmail: _userEmail,
  userName,
  currentAccessStage: _currentAccessStage = 'none',
}: InviteUserButtonProps) {
  const [selectedStage, setSelectedStage] = useState<AccessStage>('beta');
  const queryClient = useQueryClient();

  const inviteUserMutation = useMutation({
    ...trpc.user.inviteUser.mutationOptions({}),
    onSuccess: () => {
      toast.success(`Invited ${userName} to ${selectedStage} access`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'listUsers'] });
    },
    onError: (error) => {
      toast.error(`Failed to invite user: ${error.message}`);
    },
  });

  const handleInvite = () => {
    inviteUserMutation.mutate({ userId, accessStage: selectedStage });
  };

  const selectedStageInfo = ACCESS_STAGES.find(
    (stage) => stage.value === selectedStage
  );

  return (
    <div className="flex items-center">
      <Button
        className="rounded-r-none border-r-0"
        disabled={inviteUserMutation.isPending}
        onClick={handleInvite}
        size="sm"
        variant="outline"
      >
        {inviteUserMutation.isPending ? (
          <>
            <Send className="mr-1 h-3 w-3 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="mr-1 h-3 w-3" />
            Invite to {selectedStageInfo?.label}
          </>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="rounded-l-none border-l-0 px-2"
            disabled={inviteUserMutation.isPending}
            size="sm"
            variant="outline"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {ACCESS_STAGES.map((stage) => (
            <DropdownMenuItem
              className={`cursor-pointer ${selectedStage === stage.value ? 'bg-accent' : ''}`}
              key={stage.value}
              onClick={() => setSelectedStage(stage.value)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{stage.label}</span>
                <span className="text-muted-foreground text-xs">
                  {stage.description}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
