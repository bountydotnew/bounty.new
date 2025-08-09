import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BetaApplicationForm } from "@/components/sections/home/beta-application-form";
import Bounty from "@/components/icons/bounty";
import { BETA_APPLICATION_MESSAGES } from "@/constants/dashboard";
import type { UserData, BetaSubmission } from "@/types/dashboard";

interface BetaAccessScreenProps {
  userData?: UserData;
  sessionUserName?: string;
  existingSubmission?: BetaSubmission;
  isMobile: boolean;
  onSubmissionRefetch: () => void;
}

export function BetaAccessScreen({
  userData,
  sessionUserName,
  existingSubmission,
  isMobile,
  onSubmissionRefetch,
}: BetaAccessScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userName = userData?.name || sessionUserName;
  const hasSubmitted = existingSubmission?.hasSubmitted;
  const isDenied = userData?.betaAccessStatus === "denied";

  const getButtonText = () => {
    if (!hasSubmitted) return BETA_APPLICATION_MESSAGES.BUTTON_LABELS.FILL_APPLICATION;
    return isDenied
      ? BETA_APPLICATION_MESSAGES.BUTTON_LABELS.APPLICATION_DENIED
      : BETA_APPLICATION_MESSAGES.BUTTON_LABELS.APPLICATION_SUBMITTED;
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    onSubmissionRefetch();
  };

  const ApplicationButton = (
    <Button
      variant="default"
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      disabled={hasSubmitted}
      aria-describedby={hasSubmitted ? "application-status" : undefined}
    >
      {getButtonText()}
    </Button>
  );

  const FormContent = (
    <BetaApplicationForm onSuccess={handleFormSuccess} />
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-full space-y-4">
      <Bounty className="w-20 h-20 mb-10" aria-hidden="true" />
      
      <h1 className="text-2xl font-bold">Hi, {userName}!</h1>
      
      <p className="text-muted-foreground text-center max-w-md">
        {BETA_APPLICATION_MESSAGES.BETA_PHASE_MESSAGE}
      </p>

      {hasSubmitted && (
        <div id="application-status" className="sr-only">
          Your application has been {isDenied ? "denied" : "submitted"}
        </div>
      )}

      {isMobile ? (
        <Drawer open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DrawerTrigger asChild>{ApplicationButton}</DrawerTrigger>
          <DrawerContent className="max-h-[82vh]">
            <div className="mx-auto w-full max-w-md">
              <DrawerHeader>
                <DrawerTitle className="mt-8">{BETA_APPLICATION_MESSAGES.TITLE}</DrawerTitle>
                <DrawerDescription className="leading-6 mt-2">
                  {BETA_APPLICATION_MESSAGES.DESCRIPTION}
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0">{FormContent}</div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>{ApplicationButton}</DialogTrigger>
          <DialogContent className="max-w-md" showOverlay>
            <DialogHeader>
              <DialogTitle>{BETA_APPLICATION_MESSAGES.TITLE}</DialogTitle>
              <DialogDescription>{BETA_APPLICATION_MESSAGES.DESCRIPTION}</DialogDescription>
            </DialogHeader>
            {FormContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}