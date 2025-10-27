'use client';

import { Button } from '@bounty/ui/components/button';
import { Dialog, DialogContent } from '@bounty/ui/components/dialog';
import { ArrowRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useConfetti } from '@/context/confetti-context';

export function Onboarding() {
  const [step, setStep] = useState(0);
  const { celebrate } = useConfetti();
  const [isOpen, setIsOpen] = useState(false);

  // Check localStorage only on the client side to avoid SSR/hydration mismatch
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && step === 0) {
      celebrate();
    }
  }, [isOpen, step, celebrate]);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

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
            <NextButton onClick={handleClose}>close this FOREVER!!</NextButton>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
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
