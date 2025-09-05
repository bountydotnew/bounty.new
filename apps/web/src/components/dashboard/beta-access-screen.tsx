import { useState } from 'react';
import Bounty from '@/components/icons/bounty';
import { BetaApplicationForm } from '@/components/sections/home/beta-application-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { BETA_APPLICATION_MESSAGES } from '@/constants/dashboard';
import type { BetaSubmission, UserData } from '@/types/dashboard';

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
  const isDenied = userData?.betaAccessStatus === 'denied';

  const getButtonText = () => {
    if (!hasSubmitted) {
      return BETA_APPLICATION_MESSAGES.BUTTON_LABELS.FILL_APPLICATION;
    }
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
      aria-describedby={hasSubmitted ? 'application-status' : undefined}
      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      disabled={hasSubmitted}
      variant="default"
    >
      {getButtonText()}
    </Button>
  );

  const FormContent = <BetaApplicationForm onSuccess={handleFormSuccess} />;

  return (
    <div className="flex min-h-full flex-col items-center justify-center space-y-4">
      <Bounty aria-hidden="true" className="mb-10 h-20 w-20" />

      <h1 className="font-bold text-2xl">Hi, {userName}!</h1>

      <p className="max-w-md text-center text-muted-foreground">
        {BETA_APPLICATION_MESSAGES.BETA_PHASE_MESSAGE}
      </p>

      {hasSubmitted && (
        <div className="sr-only" id="application-status">
          Your application has been {isDenied ? 'denied' : 'submitted'}
        </div>
      )}

      {isMobile ? (
        <Drawer onOpenChange={setIsModalOpen} open={isModalOpen}>
          <DrawerTrigger asChild>{ApplicationButton}</DrawerTrigger>
          <DrawerContent className="max-h-[82vh]">
            <div className="mx-auto w-full max-w-md">
              <DrawerHeader>
                <DrawerTitle className="mt-8">
                  {BETA_APPLICATION_MESSAGES.TITLE}
                </DrawerTitle>
                <DrawerDescription className="mt-2 leading-6">
                  {BETA_APPLICATION_MESSAGES.DESCRIPTION}
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0">{FormContent}</div>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog onOpenChange={setIsModalOpen} open={isModalOpen}>
          <DialogTrigger asChild>{ApplicationButton}</DialogTrigger>
          <DialogContent className="max-w-md" showOverlay>
            <DialogHeader>
              <DialogTitle>{BETA_APPLICATION_MESSAGES.TITLE}</DialogTitle>
              <DialogDescription>
                {BETA_APPLICATION_MESSAGES.DESCRIPTION}
              </DialogDescription>
            </DialogHeader>
            {FormContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
