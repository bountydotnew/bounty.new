"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useBilling } from "@/hooks/use-billing";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import Image from "next/image";

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingDialog({ open, onOpenChange }: PricingDialogProps) {
  const { checkout } = useBilling();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<
    "pro-monthly" | "pro-annual"
  >("pro-annual");

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      await checkout(selectedPlan);
      toast.success("Redirecting to checkout...");
      onOpenChange(false);
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Lower fees on bounty transactions",
    "Create multiple concurrent bounties",
    "Priority support",
    "Early access to new features",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex w-auto items-center justify-center rounded-2xl border-none p-1"
        showOverlay
      >
        <DialogTitle className="text-center text-2xl"></DialogTitle>

        <div className="relative inline-flex h-[535px] w-96 flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-400 bg-zinc-900/50 p-5 outline outline-offset-[4px] outline-gray-400 dark:border-[#2D2D2D] dark:outline-[#2D2D2D]">
          <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
            <div className="absolute -right-0 -top-52 h-auto w-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 blur-3xl" />
          </div>

          <div className="absolute inset-0 z-10">
            <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900/50 z-20" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900/80 z-10" />
              <div className="absolute inset-0 bg-black/20 z-5" />
              <div className="h-full w-full bg-gradient-to-br from-blue-600/30 to-purple-600/30">
                {/* Image will be placed here */}
                <div className="h-full w-full flex items-center justify-center text-white/50 text-sm">
                  <Image
                    className="object-cover h-full w-full"
                    src="https://pbs.twimg.com/profile_banners/1841743506332909569/1753299877/1500x500"
                    alt="Bounty Pro"
                    width={1000}
                    height={1000}
                  />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 via-zinc-900/10 to-zinc-900/90 z-30" />
            </div>
          </div>

          <div className="relative right-5 top-[-70px] h-56 w-[720px]">
            <div className="absolute left-[-157px] top-[-68.43px] h-36 w-[1034px] rounded-full bg-white/10 mix-blend-overlay blur-[100px]" />
          </div>

          <div className="relative z-10 flex flex-col items-start justify-start gap-5 self-stretch h-full">
            <div className="flex flex-col items-start justify-start gap-4 self-stretch">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedPlan === "pro-annual"}
                    onCheckedChange={(checked) =>
                      setSelectedPlan(checked ? "pro-annual" : "pro-monthly")
                    }
                  />
                  <p className="text-sm text-white/70">Billed Annually</p>
                  <div className="rounded-full border border-[#656565] bg-[#3F3F3F] px-2 py-1 text-xs text-white">
                    Save 20%
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                <div className="inline-flex items-end justify-start gap-1 self-stretch">
                  <div className="justify-center text-4xl font-semibold leading-10 text-white">
                    ${selectedPlan === "pro-annual" ? "15" : "20"}
                    {selectedPlan === "pro-annual" && (
                      <span className="ml-2 text-base font-normal text-white/40 line-through">
                        $20
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pb-0.5">
                    <div className="justify-center text-sm font-medium leading-tight text-white/40">
                      / MONTH
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                  <div className="justify-center self-stretch text-sm font-normal leading-normal text-white opacity-70 lg:text-base">
                    For developers and teams who want to streamline open source
                    contributions.
                  </div>
                </div>
              </div>
            </div>
            <div className="h-0 self-stretch outline outline-1 outline-offset-[-0.50px] outline-white/10"></div>
            <div className="flex flex-col items-start justify-start gap-2.5 self-stretch">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="inline-flex items-center justify-start gap-2.5"
                >
                  <div className="flex h-5 w-5 items-center justify-center gap-3 rounded-[125px] bg-[#1F1F1F] p-[5px] dark:bg-white/10">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div className="justify-center text-sm font-normal leading-normal text-white lg:text-base">
                    {feature}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-1"></div>
            <button
              className="z-50 inline-flex h-10 cursor-pointer items-center justify-center gap-2.5 self-stretch overflow-hidden rounded-lg bg-white p-3 outline outline-1 outline-offset-[-1px] outline-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:outline-[#2D2D2D]"
              onClick={handleUpgrade}
              disabled={isLoading}
            >
              <div className="flex items-center justify-center gap-2.5 px-1">
                <div className="justify-start text-center font-semibold leading-none text-black">
                  {isLoading ? "Processing..." : `Upgrade to Pro`}
                </div>
              </div>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
