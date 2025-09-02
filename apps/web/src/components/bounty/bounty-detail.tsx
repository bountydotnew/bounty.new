import { Share2, Bookmark, Check, Target, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SubmissionCard from "@/components/bounty/submission-card";
import Composer from "../markdown/Composer";
import { Badge } from "../ui/badge";
import { SmartNavigation } from "@/components/ui/smart-breadcrumb";
import { EditBountyModal } from "@/components/bounty/edit-bounty-modal";
import { formatBountyAmount, useBountyModals } from "@/lib/bounty-utils";
import { formatLargeNumber } from "@/lib/utils";

interface BountyDetailPageProps {
  id: string;
  title: string;
  amount: number;
  description: string;
  tags: string[];
  user: string;
  rank: string;
  avatarSrc: string;
  hasBadge: boolean;
  canEditBounty: boolean;
}

export default function BountyDetailPage({
  id,
  title,
  description,
  amount,
  tags,
  user,
  rank,
  avatarSrc,
  canEditBounty,
}: BountyDetailPageProps) {
  const { editModalOpen, openEditModal, closeEditModal, editingBountyId } = useBountyModals();

  return (
    <div className="min-h-screen bg-[#111110] text-white p-6">
      <div className="max-w-[90%] mx-auto">
        {/* Smart Navigation */}
        <SmartNavigation />

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 xl:flex-[2]">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-4xl font-bold leading-[120%] tracking-tight text-white">
                  {title}
                </h1>
                <span className="text-2xl font-semibold text-green-400">
                  ${formatLargeNumber(amount)}
                </span>
              </div>

              {/* <div className="flex items-center gap-4 mb-6">
                {tags.length > 0 ? (
                  <div className="flex items-center gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-green-400 text-xs font-medium"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500 text-white transition-colors">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">New</span>
                    </div>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2C2C2C] text-white transition-colors">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">Development</span>
                    </div>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2C2C2C] text-white transition-colors">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">Design</span>
                    </div>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2C2C2C] text-white transition-colors">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">OSS</span>
                    </div>
                  </>
                )}
              </div> */}

              {/* User Profile with Actions */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{user}</span>
                      <div className="w-4 h-4 bg-blue-500 rounded transform rotate-45 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white transform -rotate-45" />
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs">{rank}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {canEditBounty && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openEditModal(id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2A2A28] hover:bg-[#383838] text-gray-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-gray-100 text-black transition-colors"
                  >
                    <Bookmark className="w-4 h-4" />
                    Bookmark
                  </Button>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="mb-8 p-6 rounded-lg bg-[#1D1D1D] border border-[#383838]/20">
              <h2 className="text-xl font-medium text-white mb-4">
                About
              </h2>
              <Composer>{description}</Composer>
            </div>


          </div>

          {/* Submissions Sidebar */}
          <div className="w-full xl:w-[480px] xl:flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Submissions</h3>
              <Button className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-primary-foreground transition-colors">
                Add submission
              </Button>
            </div>

            <div className="space-y-4">
              <SubmissionCard
                user="Fishy"
                rank="Rank 5"
                description="Here is my submission for the shadcn styling, in the ss you can se how the user can select the theme"
                avatarSrc="/placeholder.svg?height=40&width=40"
                hasBadge={true}
                previewSrc="/placeholder.svg?height=80&width=80"
                className="w-full"
              />

              <SubmissionCard
                user="Sergio"
                rank="Rank 2"
                description="I one shotted this with v0"
                avatarSrc="/placeholder.svg?height=40&width=40"
                hasBadge={true}
                previewSrc="/placeholder.svg?height=80&width=80"
                className="w-full"
              />

              <SubmissionCard
                user="Ahmet"
                rank="New user"
                description="There is my try"
                avatarSrc="/placeholder.svg?height=40&width=40"
                hasBadge={false}
                previewSrc="/placeholder.svg?height=80&width=80"
                className="w-full"
              />

              <div className="text-center text-gray-400 text-sm mt-6">
                That&apos;s all for now...
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditBountyModal
        open={editModalOpen}
        onOpenChange={closeEditModal}
        bountyId={editingBountyId}
      />
    </div>
  );
}
