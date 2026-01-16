'use client';

import { Button } from '@bounty/ui/components/button';
import { Dialog, DialogContent } from '@bounty/ui/components/dialog';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { handleSchema } from '@bounty/ui/lib/forms';
import { ArrowRightIcon, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useConfetti } from '@/context/confetti-context';
import { useUser } from '@/context/user-context';
import { trpc, trpcClient } from '@/utils/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';

export function Onboarding() {
  const [step, setStep] = useState(0);
  const { celebrate } = useConfetti();
  const [isOpen, setIsOpen] = useState(false);
  const [handle, setHandle] = useState('');
  const [handleError, setHandleError] = useState<string>('');
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [isHandleAvailable, setIsHandleAvailable] = useState<boolean | null>(
    null
  );

  const queryClient = useQueryClient();
  const { user: userData } = useUser();

  const setHandleMutation = useMutation(
    trpc.user.setHandle.mutationOptions({
      onSuccess: () => {
        const queryKey = trpc.user.getMe.queryOptions().queryKey;
        queryClient.invalidateQueries({ queryKey });
      },
    })
  );

  // Force show onboarding if user doesn't have a handle (disrespect cookie)
  useEffect(() => {
    if (userData && !userData.handle) {
      // User needs to set handle - force show onboarding and skip to handle step
      setIsOpen(true);
      setStep(3);
    }
  }, [userData]);

  useEffect(() => {
    if (isOpen && step === 0) {
      celebrate();
    }
  }, [isOpen, step, celebrate]);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleClose = () => {
    // Only allow closing if user has a handle
    if (userData?.handle) {
      setIsOpen(false);
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
    // If user doesn't have a handle, don't allow closing (onboarding will stay open)
  };

  const checkHandleAvailability = useCallback(async (handleValue: string) => {
    if (!handleValue) {
      setIsHandleAvailable(null);
      return;
    }

    // Validate format first
    const validation = handleSchema.safeParse(handleValue);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      setHandleError(firstError?.message || 'Invalid handle');
      setIsHandleAvailable(false);
      return;
    }

    setHandleError('');
    setIsCheckingHandle(true);

    try {
      const result = await trpcClient.user.checkHandleAvailability.query({
        handle: handleValue,
      });
      setIsHandleAvailable(result.available);
      if (!result.available) {
        setHandleError('This handle is already taken');
      }
    } catch (error) {
      // Extract error message from TRPC error
      if (error instanceof TRPCClientError) {
        // Use the error message from TRPC (includes Zod validation messages)
        setHandleError(error.message);
      } else if (error instanceof Error) {
        setHandleError(error.message);
      } else {
        setHandleError('Failed to check availability');
      }
      setIsHandleAvailable(false);
    } finally {
      setIsCheckingHandle(false);
    }
  }, []);

  const handleSetHandle = async () => {
    if (!handle || isHandleAvailable !== true) {
      return;
    }

    try {
      await setHandleMutation.mutateAsync({ handle });
      // After setting handle, close the onboarding
      setIsOpen(false);
      localStorage.setItem('hasSeenOnboarding', 'true');
    } catch {
      setHandleError('Failed to set handle. Please try again.');
    }
  };

  useEffect(() => {
    if (handle.length >= 3) {
      const timer = setTimeout(() => {
        checkHandleAvailability(handle);
      }, 500);
      return () => clearTimeout(timer);
    }
    setIsHandleAvailable(null);
    setHandleError('');
  }, [handle, checkHandleAvailability]);

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Title title="welcome to the beta! 😎" />
              <Description description="you're the first person ***ever*** to try it! (I'm totally not lying)" />
            </div>
            <NextButton onClick={handleNext}>Next</NextButton>
          </div>
        );
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Title title="bounty is still in a suuuper early beta..." />
              <Description description="and there are tons of bugs and really broken things. but we're working on it!" />
              <Description description="if you're curious, check out our roadmap [here](https://bounty.new/roadmap)" />
            </div>
            <NextButton onClick={handleNext}>Next</NextButton>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Title title="have fun!" />
              <Description description="join our [discord](https://bounty.new/discord), chat with the rest of the nerds and tell me what else is broken lmao." />
            </div>
            <NextButton
              onClick={() => {
                // Only allow closing if user has a handle, otherwise go to handle step
                if (userData?.handle) {
                  handleClose();
                } else {
                  setStep(3);
                }
              }}
            >
              close this FOREVER!!
            </NextButton>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Title title="we're missing some details from you" />
              <Description description="please choose a username (handle) for your profile. this will be used in your profile URL." />
              <div className="space-y-2">
                <Label htmlFor="handle">Username</Label>
                <div className="relative">
                  <Input
                    id="handle"
                    onChange={(e) => setHandle(e.target.value.toLowerCase())}
                    placeholder="yourhandle"
                    value={handle}
                  />
                  {isCheckingHandle && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {!isCheckingHandle && isHandleAvailable === true && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  {!isCheckingHandle && isHandleAvailable === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>
                {handleError && (
                  <p className="text-destructive text-sm">{handleError}</p>
                )}
                {isHandleAvailable && (
                  <p className="text-green-600 text-sm">
                    This handle is available!
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  3-20 characters, lowercase letters, numbers, hyphens, and
                  underscores only
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={
                !handle ||
                isHandleAvailable !== true ||
                isCheckingHandle ||
                setHandleMutation.isPending
              }
              onClick={handleSetHandle}
              variant="default"
            >
              {setHandleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting handle...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        // Prevent closing if user doesn't have a handle
        if (!open && userData && !userData.handle) {
          return; // Don't allow closing
        }
        handleClose();
      }}
      open={isOpen}
    >
      <DialogContent className="!outline-none sm:max-w-[425px]">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}

function Title({ title }: { title: string }) {
  return <h2 className="font-bold text-lg md:text-xl">{title}</h2>;
}

// function Subtitle({ subtitle }: { subtitle: string }) {
//   return <h3 className="text-lg font-medium">{subtitle}</h3>;
// }

function Description({ description }: { description: string }) {
  return (
    <div className="text-muted-foreground">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-0">{children}</p>,
          a: ({ href, children, ...props }) => (
            <a
              className="text-foreground underline hover:text-foreground/80"
              href={href}
              rel="noopener noreferrer"
              target="_blank"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {description}
      </ReactMarkdown>
    </div>
  );
}

function NextButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button className="w-full" onClick={onClick} variant="default">
      {children}
      <ArrowRightIcon className="h-4 w-4" />
    </Button>
  );
}
