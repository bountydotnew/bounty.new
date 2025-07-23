import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { Badge } from "@/components/bounty/badge";

export interface BountyCardProps {
  user: string;
  description?: string;
  avatarSrc?: string;
  avatar?: string;
  rank?: string;
  hasBadge?: boolean;
  previewSrc?: string;
}

export default function BountyCard({ user, description = "", avatarSrc = "", rank = "Rank 100", previewSrc = "" }: BountyCardProps) {
  return (
    <div className="bountyCard flex w-full max-w-[466px] min-w-[466px] flex-col items-start gap-3 rounded-lg bg-[#2C2C2C] p-6 shadow-card-custom">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarSrc} alt={user} />
            <AvatarFallback>{user.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-base font-semibold text-[#F3F3F3]">{user}</span>
              <Badge />
            </div>
            <span className="text-sm text-foreground">{rank}</span>
          </div>
        </div>
        <Button className="previewButton flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-white dark:text-black shadow-button-custom">
          <Github className="h-4 w-4 text-white dark:text-black" />
          <span className="text-sm font-medium">Preview</span>
        </Button>
      </div>
      <p className="font-light text-[#FFFFFF]">
        {description}
      </p>
      <img
        src={previewSrc}
        alt="Theme preview screenshot"
        className="h-20 w-20 rounded-md object-cover"
      />
    </div>
  )
}
