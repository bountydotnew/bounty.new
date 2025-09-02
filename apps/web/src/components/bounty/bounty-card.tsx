import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Bounty } from "@/types/dashboard";
import { useRouter, usePathname } from "next/navigation";
import { addNavigationContext } from "@/hooks/use-navigation-context";
import { formatLargeNumber } from "@/lib/utils";

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
      className="cursor-pointer bountyCard flex w-full flex-col items-start gap-3 rounded-lg bg-[#1D1D1D] p-6 hover:bg-[#2A2A28] transition-colors border border-[#383838]/20"
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
              <span className="text-sm font-medium text-white">
                {creatorName}
              </span>
            </div>
            <span className="text-xs text-gray-400 capitalize">
              {bounty.status.replace("_", " ")}
            </span>
          </div>
        </div>
        <span className="text-sm font-semibold text-green-400">
          ${formatLargeNumber(bounty.amount)}
        </span>
      </div>

      <div className="w-full">
        <h3 className="text-base font-medium text-white mb-2 line-clamp-2">
          {bounty.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-3">
          {bounty.description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
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
