import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Bounty } from "@/types/dashboard";
import { useRouter, usePathname } from "next/navigation";
import { addNavigationContext } from "@/hooks/use-navigation-context";

interface BountyCardProps {
  bounty: Bounty;
}

export const BountyCard = memo(function BountyCard({
  bounty,
}: BountyCardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    const url = addNavigationContext(`/bounty/${bounty.id}`, pathname);
    router.push(url);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  const formattedDate = formatDate(bounty.createdAt);
  const creatorInitial = bounty.creator.name?.charAt(0)?.toUpperCase() || "U";
  const creatorName = bounty.creator.name || "Anonymous";

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer bountyCard flex w-full flex-col items-start gap-3 rounded-lg bg-[#2C2C2C] p-6 shadow-card-custom hover:bg-[#2C2C2C]/80 transition-colors"
      tabIndex={0}
      role="button"
      aria-label={`View bounty: ${bounty.title}`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={bounty.creator.image || ""}
              alt={bounty.creator.name || ""}
            />
            <AvatarFallback>{creatorInitial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-base font-semibold text-[#F3F3F3]">
                {creatorName}
              </span>
            </div>
            <span className="text-sm text-foreground capitalize">
              {bounty.status.replace("_", " ")}
            </span>
          </div>
        </div>
        <div
          className="text-lg font-bold text-[#0CA223]"
          aria-label={`Bounty amount: $${bounty.amount}`}
        >
          ${bounty.amount}
        </div>
      </div>

      <div className="w-full">
        <h3 className="text-lg font-semibold text-[#EFEFEF] mb-2 line-clamp-2">
          {bounty.title}
        </h3>
        <p className="font-light text-[#FFFFFF] line-clamp-3">
          {bounty.description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-[#B3B3B3] mt-auto">
        <Clock className="h-4 w-4" aria-hidden="true" />
        <time
          dateTime={bounty.createdAt}
          title={new Date(bounty.createdAt).toLocaleString()}
        >
          {formattedDate}
        </time>
      </div>
    </div>
  );
});
