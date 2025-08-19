import { Share2, Bookmark, Check, Target, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SubmissionCard from "@/components/bounty/submission-card";
import Composer from "../markdown/Composer";
import { Badge } from "../ui/badge";
import { SmartNavigation } from "@/components/ui/smart-breadcrumb";
import { EditBountyModal } from "@/components/bounty/edit-bounty-modal";
import { formatBountyAmount, useBountyModals } from "@/lib/bounty-utils";

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
    <div className="min-h-screen bg-background text-[#EFEFEF] p-6">
      <div className="max-w-[90%] mx-auto">
        {/* Smart Navigation */}
        <SmartNavigation />

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 xl:flex-[2]">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-5xl font-bold leading-[120%] tracking-[-0.96px] text-foreground">
                  {title}
                </h1>
                <span className="text-4xl font-bold text-[#0CA223]">
                  {formatBountyAmount(amount, "USD")}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                {/* Tags */}
                {tags.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0CA223] text-white text-sm font-medium shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-transparent border-white/20 text-white/70 hover:bg-white/5 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0CA223] text-white text-sm font-medium shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">New</span>
                    </div>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2C2C2C] text-white text-sm font-medium shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">Development</span>
                    </div>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2C2C2C] text-white text-sm font-medium shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">Design</span>
                    </div>
                    <div className="max-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#2C2C2C] text-white text-sm font-medium shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]">
                      <Target className="w-4 h-4" />
                      <span className="text-xs">OSS</span>
                    </div>
                  </>
                )}
              </div>

              {/* User Profile with Actions */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{user}</span>
                      <div className="w-4 h-4 bg-[#1F8CEC] rounded transform rotate-45 flex items-center justify-center shadow-[inset_0_-0.6px_0.6px_0_rgba(30,30,30,0.2),inset_0_0.6px_0.6px_0_#FFF]">
                        <Check className="w-2.5 h-2.5 text-white transform -rotate-45" />
                      </div>
                    </div>
                    <span className="text-muted-foreground text-sm">{rank}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {canEditBounty && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openEditModal(id)}
                      className="flex items-center justify-center gap-2 px-4 py-5 rounded-lg bg-[#0CA223] hover:bg-[#0CA223]/80 shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]"
                    >
                      <Edit className="w-4 h-4 text-white" />
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center justify-center gap-2 px-4 py-5 rounded-lg bg-[#2C2C2C] hover:bg-[#2c2c2c]/60 shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_#535353]"
                  >
                    <Share2 className="w-4 h-4 text-[#EFEFEF]" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center justify-center gap-2 px-4 py-5 rounded-lg bg-[#E6E6E6] hover:bg-[#E6E6E6]/80 shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_#FFF]"
                  >
                    <Bookmark className="w-4 h-4 text-[#1E1E1E]" />
                  </Button>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="mb-8 p-6 rounded-lg bg-card shadow-[inset_0_-1px_1px_0_rgba(30,30,30,0.2),inset_0_1px_1px_0_rgba(255,255,255,0.2)]">
              <h2 className="text-2xl font-bold leading-[120%] tracking-[-0.48px] text-foreground mb-4">
                About
              </h2>
              <Composer>{description}</Composer>
            </div>


          </div>

          {/* Submissions Sidebar */}
          <div className="w-full xl:w-[480px] xl:flex-shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Submissions</h3>
              <Button className="buttonShadow flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-white dark:text-black shadow-button-custom">
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

              <div className="text-center text-[#767676] text-sm mt-6">
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
