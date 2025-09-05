import { Github } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/bounty/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@bounty/ui/components/avatar';
import { Button } from '@bounty/ui/components/button';
import { cn } from '@bounty/ui/lib/utils';

export interface SubmissionCardProps {
  user: string;
  description?: string;
  avatarSrc?: string;
  avatar?: string;
  rank?: string;
  hasBadge?: boolean;
  previewSrc?: string;
  className?: string;
}

export default function SubmissionCard({
  user,
  description = '',
  avatarSrc = '',
  rank = 'Rank 100',
  previewSrc = '',
  hasBadge,
  className,
}: SubmissionCardProps) {
  return (
    <div
      className={cn(
        'flex w-full min-w-[466px] max-w-[466px] flex-col items-start gap-3 rounded-lg bg-[#222222] p-6 transition-colors hover:bg-[#2A2A28]',
        className
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage alt={user} src={avatarSrc} />
            <AvatarFallback>{user.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm text-white">{user}</span>
              {hasBadge && <Badge />}
            </div>
            <span className="text-gray-400 text-xs">{rank}</span>
          </div>
        </div>
        <Button className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-white dark:text-black">
          <Github className="h-4 w-4 text-white dark:text-black" />
          <span className="font-medium text-sm">Preview</span>
        </Button>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
      <Image
        alt="Theme preview screenshot"
        className="h-20 w-20 rounded-md object-cover"
        height={80}
        src={previewSrc}
        width={80}
      />
    </div>
  );
}
