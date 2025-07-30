import { memo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Bounty } from "@/types/dashboard";

interface BountyCardProps {
  bounty: Bounty;
  onClick?: (bounty: Bounty) => void;
}

export const BountyCard = memo(function BountyCard({ bounty, onClick }: BountyCardProps) {
  const handleClick = () => {
    onClick?.(bounty);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const formattedDate = formatDate(bounty.createdAt);
  const creatorInitial = bounty.creator?.name?.charAt(0)?.toUpperCase() || 'U';
  const creatorName = bounty.creator?.name || 'Anonymous';

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? `View bounty: ${bounty.title}` : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg line-clamp-2">{bounty.title}</CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant={bounty.status === 'open' || bounty.status === 'in_progress' ? 'default' : 'secondary'}
              aria-label={`Status: ${bounty.status}`}
            >
              {bounty.status.replace('_', ' ')}
            </Badge>
            <div className="text-lg font-bold text-primary" aria-label={`Bounty amount: $${bounty.amount}`}>
              ${formatNumber(bounty.amount)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-3 line-clamp-3">{bounty.description}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <time dateTime={bounty.createdAt} title={new Date(bounty.createdAt).toLocaleString()}>
              {formattedDate}
            </time>
          </div>
          <div className="flex items-center gap-1">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {creatorInitial}
              </AvatarFallback>
            </Avatar>
            <span>{creatorName}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});