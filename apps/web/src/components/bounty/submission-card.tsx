import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { Badge } from "@/components/bounty/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
  description = "",
  avatarSrc = "",
  rank = "Rank 100",
  previewSrc = "",
  hasBadge,
  className,
}: SubmissionCardProps) {
  return (
    <div className={cn("flex w-full max-w-[466px] min-w-[466px] flex-col items-start gap-3 rounded-lg bg-[#222222] p-6 hover:bg-[#2A2A28] transition-colors", className)}>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarSrc} alt={user} />
            <AvatarFallback>{user.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-white">
                {user}
              </span>
              {hasBadge && <Badge />}
            </div>
            <span className="text-xs text-gray-400">{rank}</span>
          </div>
        </div>
        <Button className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-white dark:text-black">
          <Github className="h-4 w-4 text-white dark:text-black" />
          <span className="text-sm font-medium">Preview</span>
        </Button>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
      <Image
        width={80}
        height={80}
        src={previewSrc}
        alt="Theme preview screenshot"
        className="h-20 w-20 rounded-md object-cover"
      />
    </div>
  );
}
