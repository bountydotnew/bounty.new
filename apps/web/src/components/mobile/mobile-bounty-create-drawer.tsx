'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Drawer, DrawerContent } from '@bounty/ui/components/drawer';
import { CloseXIcon, GithubIcon } from '@bounty/ui';
import { useHaptics } from '@bounty/ui/hooks/use-haptics';
import { cn } from '@bounty/ui/lib/utils';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { hasProfanity } from '@bounty/ui/lib/profanity';
import { trpcClient } from '@/utils/trpc';
import { useGitHubInstallationRepositories } from '@/hooks/use-github-installation-repos';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';

// Schema for mobile bounty creation
const mobileBountySchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(200, 'Title too long')
    .refine((val) => !hasProfanity(val), 'Your submission contains prohibited language.'),
  amount: z
    .string()
    .regex(/^\d{1,13}(\.\d{1,2})?$/, 'Invalid amount'),
});

type MobileBountyForm = z.infer<typeof mobileBountySchema>;

type Step = 'title' | 'amount' | 'repo';

interface MobileBountyCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileBountyCreateDrawer({
  open,
  onOpenChange,
}: MobileBountyCreateDrawerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('title');
  const haptics = useHaptics();

  // GitHub repos
  const {
    installations,
    installationRepos,
    selectedRepository,
    setSelectedRepository,
  } = useGitHubInstallationRepositories();

  const form = useForm<MobileBountyForm>({
    resolver: zodResolver(mobileBountySchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      amount: '0',
    },
  });

  const { watch, setValue, trigger, reset, formState: { errors } } = form;
  const title = watch('title');
  const amount = watch('amount');

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setStep('title');
      reset();
      setSelectedRepository('');
    }
  }, [open, reset, setSelectedRepository]);

  // Create bounty mutation
  const createBounty = useMutation({
    mutationFn: async (input: {
      title: string;
      amount: string;
      description: string;
      currency: string;
      repositoryUrl?: string;
      payLater: boolean;
    }) => {
      return await trpcClient.bounties.createBounty.mutate(input);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'fetchAllBounties']],
      });
      queryClient.invalidateQueries({
        queryKey: [['bounties', 'fetchMyBounties']],
      });

      haptics.trigger('success');
      toast.success('Bounty created!');
      handleClose();

      if (result?.data?.id) {
        router.push(`/bounty/${result.data.id}`);
      }
    },
    onError: (error: Error) => {
      haptics.trigger('error');
      toast.error(`Failed to create bounty: ${error.message}`);
    },
  });

  const handleClose = useCallback(() => {
    haptics.trigger('light');
    onOpenChange(false);
  }, [onOpenChange, haptics]);

  const handleContinue = useCallback(async () => {
    if (step === 'title') {
      const isValid = await trigger('title');
      if (isValid && title.trim()) {
        haptics.trigger('medium');
        setStep('amount');
      } else {
        haptics.trigger('error');
      }
    } else if (step === 'amount') {
      const isValid = await trigger('amount');
      if (isValid) {
        haptics.trigger('medium');
        setStep('repo');
      } else {
        haptics.trigger('error');
      }
    } else if (step === 'repo') {
      // Create the bounty
      haptics.trigger('medium');
      createBounty.mutate({
        title,
        amount,
        description: title, // Use title as description for mobile flow
        currency: 'USD',
        repositoryUrl: selectedRepository
          ? `https://github.com/${selectedRepository}`
          : undefined,
        payLater: true, // Mobile flow creates unfunded bounties
      });
    }
  }, [step, title, amount, trigger, haptics, selectedRepository, createBounty]);

  const handleKeyPress = useCallback((key: string) => {
    haptics.trigger('light');
    if (key === 'backspace') {
      setValue('amount', amount.length > 1 ? amount.slice(0, -1) : '0');
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setValue('amount', amount + '.');
      }
    } else {
      setValue('amount', amount === '0' ? key : amount + key);
    }
  }, [amount, haptics, setValue]);

  const canContinue = step === 'title'
    ? title.trim().length > 0 && title.length <= 200 && !hasProfanity(title)
    : step === 'amount'
      ? /^\d{1,13}(\.\d{1,2})?$/.test(amount)
      : true; // Repo selection is optional

  const getStepTitle = () => {
    switch (step) {
      case 'title':
        return "What's the bounty for?";
      case 'amount':
        return 'How much is the bounty?';
      case 'repo':
        return 'Where should this bounty go?';
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col rounded-t-[34px] bg-surface-1 border-none">
        {/* Header */}
        <div className="flex h-[72px] items-center justify-between px-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-[19px] font-semibold tracking-tight text-foreground">
              {getStepTitle()}
            </h2>
            {/* Step indicator */}
            <div className="flex gap-1">
              {(['title', 'amount', 'repo'] as const).map((s) => (
                <div
                  key={s}
                  className={cn(
                    'h-1 w-6 rounded-full transition-colors duration-150',
                    s === step ? 'bg-foreground' : 'bg-foreground/20'
                  )}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground/10 active:bg-foreground/20 transition-colors"
            aria-label="Close"
          >
            <CloseXIcon className="h-[18px] w-[18px] text-foreground/30" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col px-7 overflow-y-auto">
          {step === 'title' && (
            <TitleStep
              value={title}
              onChange={(val) => setValue('title', val)}
              onContinue={handleContinue}
              onBack={() => {}}
              canContinue={canContinue}
              showBack={false}
              error={hasProfanity(title) ? 'Your submission contains prohibited language.' : undefined}
            />
          )}
          {step === 'amount' && (
            <AmountStep
              value={amount}
              onKeyPress={handleKeyPress}
              onContinue={handleContinue}
              onBack={() => { haptics.trigger('light'); setStep('title'); }}
              canContinue={canContinue}
              showBack={true}
              error={errors.amount?.message}
            />
          )}
          {step === 'repo' && (
            <RepoStep
              installations={installations}
              installationRepos={installationRepos}
              selectedRepository={selectedRepository}
              onSelectRepository={setSelectedRepository}
              onContinue={handleContinue}
              onBack={() => { haptics.trigger('light'); setStep('amount'); }}
              showBack={true}
              isLoading={createBounty.isPending}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface TitleStepProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  canContinue: boolean;
  showBack: boolean;
  error?: string;
}

function TitleStep({ value, onChange, onContinue, onBack, canContinue, showBack, error }: TitleStepProps) {
  return (
    <>
      <div className="flex-1 py-8">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe your bounty..."
          className="w-full resize-none bg-transparent text-[27px] font-semibold leading-tight tracking-tight text-foreground placeholder:text-foreground/30 focus:outline-none"
          rows={3}
          autoFocus
        />
      </div>
      <div className="pb-8">
        {error && (
          <p className="mb-3 text-sm text-destructive">{error}</p>
        )}
        <div className="flex gap-2">
          <div
            className={cn(
              'overflow-hidden transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none',
              showBack ? 'w-12 opacity-100' : 'w-0 opacity-0'
            )}
          >
            <button
              type="button"
              onClick={onBack}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/10 active:bg-foreground/20 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className={cn(
              'flex h-12 flex-1 items-center justify-center rounded-full font-semibold text-[18px] transition-[background-color,color,transform] duration-150 active:scale-[0.98] motion-reduce:transform-none',
              canContinue
                ? 'bg-foreground text-background'
                : 'bg-foreground/20 text-foreground/40 cursor-not-allowed'
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );
}

interface AmountStepProps {
  value: string;
  onKeyPress: (key: string) => void;
  onContinue: () => void;
  onBack: () => void;
  canContinue: boolean;
  showBack: boolean;
  error?: string;
}

function AmountStep({ value, onKeyPress, onContinue, onBack, canContinue, showBack, error }: AmountStepProps) {
  const displayAmount = value === '' ? '$0' : `$${value}`;

  return (
    <div className="flex flex-1 flex-col items-center justify-between pb-6 min-h-[420px]">
      {/* Amount display */}
      <div className="flex flex-col items-center justify-center py-6">
        <span className="text-[56px] font-bold tracking-tight text-foreground tabular-nums">
          {displayAmount}
        </span>
      </div>

      {/* Number pad */}
      <div className="flex w-full max-w-[280px] flex-col gap-2">
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['.', '0', 'backspace'],
        ].map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-between">
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onKeyPress(key)}
                className="flex h-11 w-11 items-center justify-center text-[24px] font-semibold text-foreground active:opacity-50 transition-opacity"
              >
                {key === 'backspace' ? (
                  <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Continue button */}
      <div className="mt-6 w-full">
        {error && (
          <p className="mb-3 text-sm text-destructive">{error}</p>
        )}
        <div className="flex gap-2">
          <div
            className={cn(
              'overflow-hidden transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none',
              showBack ? 'w-12 opacity-100' : 'w-0 opacity-0'
            )}
          >
            <button
              type="button"
              onClick={onBack}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/10 active:bg-foreground/20 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className={cn(
              'flex h-12 flex-1 items-center justify-center rounded-full font-semibold text-[18px] transition-[background-color,color,transform] duration-150 active:scale-[0.98] motion-reduce:transform-none',
              canContinue
                ? 'bg-foreground text-background'
                : 'bg-foreground/20 text-foreground/40 cursor-not-allowed'
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

interface InstallationReposItem {
  installationId: number;
  accountLogin: string | null;
  repositories: string[];
}

interface RepoStepProps {
  installations: Array<{ id: number; accountLogin: string | null }>;
  installationRepos: InstallationReposItem[];
  selectedRepository: string;
  onSelectRepository: (repo: string) => void;
  onContinue: () => void;
  onBack: () => void;
  showBack: boolean;
  isLoading: boolean;
}

function RepoStep({
  installations,
  installationRepos,
  selectedRepository,
  onSelectRepository,
  onContinue,
  onBack,
  showBack,
  isLoading,
}: RepoStepProps) {
  const haptics = useHaptics();

  // Flatten all repos from all installations
  const allRepos = installationRepos.flatMap((install) =>
    install.repositories.map((repoFullName) => ({
      full_name: repoFullName,
      account: install.accountLogin ?? '',
    }))
  );

  const handleSelectRepo = (repoFullName: string) => {
    haptics.trigger('selection');
    onSelectRepository(repoFullName);
  };

  return (
    <div className="flex flex-1 flex-col pb-6">
      {/* Repo selector */}
      <div className="flex-1 py-4">
        <div className="flex flex-wrap items-start gap-1.5">
          {/* Repo dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-surface-2 p-1.5 active:opacity-70 transition-opacity"
              >
                <GithubIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[14px] text-foreground">
                  {selectedRepository || 'Select repo'}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-[300px] overflow-y-auto bg-surface-1 border-border-subtle"
            >
              <DropdownMenuItem
                onClick={() => handleSelectRepo('')}
                className="text-muted-foreground"
              >
                No repository
              </DropdownMenuItem>
              {allRepos.map((repo) => (
                <DropdownMenuItem
                  key={repo.full_name}
                  onClick={() => handleSelectRepo(repo.full_name)}
                  className="text-foreground"
                >
                  {repo.full_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {installations.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            No GitHub repos connected. You can add one later.
          </p>
        )}
      </div>

      {/* Create button */}
      <div className="mt-auto w-full">
        <div className="flex gap-2">
          <div
            className={cn(
              'overflow-hidden transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none',
              showBack ? 'w-12 opacity-100' : 'w-0 opacity-0'
            )}
          >
            <button
              type="button"
              onClick={onBack}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/10 active:bg-foreground/20 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            onClick={onContinue}
            disabled={isLoading}
            className={cn(
              'flex h-12 flex-1 items-center justify-center rounded-full font-semibold text-[18px] transition-[background-color,opacity,transform] duration-150 active:scale-[0.98] motion-reduce:transform-none',
              'bg-foreground text-background',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? 'Creating...' : 'Create Bounty'}
          </button>
        </div>
      </div>
    </div>
  );
}
