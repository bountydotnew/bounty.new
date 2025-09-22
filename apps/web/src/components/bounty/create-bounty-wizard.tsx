'use client';

import type { AppRouter } from '@bounty/api';
import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@bounty/ui/components/drawer';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import {
  type CreateBountyForm,
  createBountyDefaults,
  createBountySchema,
  currencyOptions,
  difficultyOptions,
  formatFormData,
} from '@bounty/ui/lib/forms';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TRPCClientErrorLike } from '@trpc/client';
import { CheckCircle, CreditCard, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MarkdownTextarea } from '@/components/bounty/markdown-editor';
import { StripePaymentForm } from '@/components/bounty/stripe-payment-form';
import { trpc } from '@/utils/trpc';

interface CreateBountyWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId?: string;
  initialValues?: Partial<CreateBountyForm>;
  redirectOnClose?: string;
  replaceOnSuccess?: boolean;
}

type WizardStep = 'details' | 'payment' | 'review';

interface WizardStepConfig {
  id: WizardStep;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const WIZARD_STEPS: WizardStepConfig[] = [
  { id: 'details', title: 'Details', icon: FileText },
  { id: 'payment', title: 'Payment', icon: CreditCard },
  { id: 'review', title: 'Review', icon: CheckCircle },
];

interface StepIndicatorProps {
  currentStep: WizardStep;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-6 flex items-center justify-center">
      {WIZARD_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted =
          WIZARD_STEPS.findIndex((s) => s.id === currentStep) > index;

        return (
          <div className="flex items-center" key={step.id}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                isActive
                  ? 'border-white bg-white text-black'
                  : isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-neutral-600 bg-transparent text-neutral-400'
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={`mx-2 h-px w-8 ${
                  isCompleted ? 'bg-green-500' : 'bg-neutral-600'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CreateBountyWizard({
  open,
  onOpenChange,
  initialValues,
  redirectOnClose,
  replaceOnSuccess,
}: CreateBountyWizardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('details');
  const [createdBountyId, setCreatedBountyId] = useState<string | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(
    null
  );
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const form = useForm<CreateBountyForm>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      ...createBountyDefaults,
      ...(initialValues || {}),
    },
  });

  const {
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
    trigger,
  } = form;

  const watchedValues = watch();

  useEffect(() => {
    if (open && initialValues) {
      reset({ ...createBountyDefaults, ...initialValues });
    }
  }, [open, initialValues, reset]);

  const createBountyDraft = useMutation({
    ...trpc.bounties.createBountyDraft.mutationOptions(),
    onSuccess: (result) => {
      if (result?.data?.id) {
        setCreatedBountyId(result.data.id);
        toast.success('Draft created! Choose your payment option.');
        setCurrentStep('payment');
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(`Failed to create draft: ${error.message}`);
    },
  });

  const fundBounty = useMutation({
    ...trpc.bounties.fundBounty.mutationOptions(),
    onSuccess: (result) => {
      if (result?.data?.clientSecret && result?.data?.paymentIntentId) {
        setPaymentClientSecret(result.data.clientSecret);
        setPaymentIntentId(result.data.paymentIntentId);
        toast.success('Payment form ready');
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(`Payment setup failed: ${error.message}`);
    },
  });

  const confirmFunding = useMutation({
    ...trpc.bounties.confirmBountyFunding.mutationOptions(),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Bounty funded successfully!');
        setCurrentStep('review');
      } else {
        toast.error('Payment not completed');
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(`Failed to confirm funding: ${error.message}`);
    },
  });

  const publishBounty = useMutation({
    ...trpc.bounties.publishBounty.mutationOptions(),
    onSuccess: (result) => {
      toast.success('Bounty created successfully!');
      queryClient.invalidateQueries({
        queryKey: ['bounties'],
        type: 'all',
      });
      reset();
      onOpenChange(false);
      if (result?.data?.id) {
        const href = `/bounty/${result.data.id}${replaceOnSuccess ? '?from=gh-issue' : ''}`;
        if (replaceOnSuccess) {
          router.replace(href);
        } else {
          router.push(href);
        }
      }
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(`Failed to publish bounty: ${error.message}`);
    },
  });

  const handleDetailsNext = async () => {
    const isValid = await trigger([
      'title',
      'description',
      'amount',
      'difficulty',
    ]);
    if (isValid) {
      const formattedData = formatFormData.createBounty(watchedValues);
      createBountyDraft.mutate(formattedData);
    }
  };

  const handlePayBounty = () => {
    if (createdBountyId) {
      fundBounty.mutate({ bountyId: createdBountyId });
    }
  };

  const handlePaymentSuccess = () => {
    if (createdBountyId && paymentIntentId) {
      confirmFunding.mutate({
        bountyId: createdBountyId,
        paymentIntentId,
      });
    }
  };

  const handlePaymentCancel = () => {
    setPaymentClientSecret(null);
    setPaymentIntentId(null);
  };

  const handleSkipPayment = () => {
    toast.info('Bounty saved as unfunded draft');
    setCurrentStep('review');
  };

  const handlePublish = () => {
    if (createdBountyId) {
      publishBounty.mutate({ bountyId: createdBountyId });
    }
  };

  const handleClose = () => {
    if (
      !(
        isSubmitting ||
        createBountyDraft.isPending ||
        fundBounty.isPending ||
        publishBounty.isPending ||
        confirmFunding.isPending
      )
    ) {
      reset();
      setCurrentStep('details');
      setCreatedBountyId(null);
      setPaymentClientSecret(null);
      setPaymentIntentId(null);
      onOpenChange(false);
      if (redirectOnClose) {
        router.push(redirectOnClose);
      }
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 'details':
        return (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="title">Title *</Label>
              <Controller
                control={control}
                name="title"
                render={({ field }) => (
                  <Input
                    {...field}
                    autoComplete="off"
                    className={errors.title ? 'border-red-500' : ''}
                    id="title"
                    placeholder="Enter bounty title"
                  />
                )}
              />
              {errors.title && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="description">Description *</Label>
              <div className="rounded-lg border border-neutral-800 bg-[#222222] p-3">
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <MarkdownTextarea
                      className={
                        errors.description ? 'border-red-500' : 'border-border'
                      }
                      id="description"
                      name={field.name}
                      onBlur={field.onBlur}
                      onChange={(val) => field.onChange(val)}
                      placeholder="Describe what needs to be done"
                      value={field.value}
                    />
                  )}
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
                <Label htmlFor="amount">Amount *</Label>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <Input
                      {...field}
                      autoComplete="off"
                      className={errors.amount ? 'border-red-500' : ''}
                      id="amount"
                      placeholder="100.00"
                    />
                  )}
                />
                {errors.amount && (
                  <p className="mt-1 text-red-500 text-sm">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
                <Label htmlFor="currency">Currency</Label>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-md border px-3 py-2"
                      id="currency"
                    >
                      {currencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <select
                    {...field}
                    className={`w-full rounded-md border px-3 py-2 ${
                      errors.difficulty ? 'border-red-500' : 'border-border'
                    }`}
                    id="difficulty"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.difficulty && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.difficulty.message}
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="repositoryUrl">Repository URL (Optional)</Label>
              <Controller
                control={control}
                name="repositoryUrl"
                render={({ field }) => (
                  <Input
                    {...field}
                    autoComplete="off"
                    className={errors.repositoryUrl ? 'border-red-500' : ''}
                    id="repositoryUrl"
                    placeholder="https://github.com/user/repo"
                    type="url"
                  />
                )}
              />
              {errors.repositoryUrl && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.repositoryUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-lg bg-neutral-900/50 p-3">
              <Label htmlFor="issueUrl">Issue URL (Optional)</Label>
              <Controller
                control={control}
                name="issueUrl"
                render={({ field }) => (
                  <Input
                    {...field}
                    autoComplete="off"
                    className={errors.issueUrl ? 'border-red-500' : ''}
                    id="issueUrl"
                    placeholder="https://github.com/user/repo/issues/123"
                    type="url"
                  />
                )}
              />
              {errors.issueUrl && (
                <p className="mt-1 text-red-500 text-sm">
                  {errors.issueUrl.message}
                </p>
              )}
            </div>
          </div>
        );

      case 'payment':
        if (paymentClientSecret) {
          return (
            <div className="space-y-4">
              <div className="mb-4 text-center">
                <h3 className="mb-2 font-semibold text-lg">Complete Payment</h3>
                <p className="text-neutral-400 text-sm">
                  Secure payment powered by Stripe
                </p>
              </div>
              <StripePaymentForm
                amount={Number.parseFloat(watchedValues.amount)}
                clientSecret={paymentClientSecret}
                currency={watchedValues.currency}
                onCancel={handlePaymentCancel}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 text-center">
              <h3 className="mb-2 font-semibold text-lg">Fund Your Bounty</h3>
              <p className="mb-4 text-neutral-400 text-sm">
                Choose how you&apos;d like to proceed with your bounty funding
              </p>

              <div className="mb-6 rounded-lg bg-neutral-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Amount</span>
                  <span className="font-semibold text-white text-xl">
                    ${watchedValues.amount} {watchedValues.currency}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1"
                  disabled={fundBounty.isPending}
                  onClick={handlePayBounty}
                >
                  {fundBounty.isPending ? 'Setting up payment...' : 'Pay Now'}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSkipPayment}
                  variant="outline"
                >
                  Skip (Save as Draft)
                </Button>
              </div>

              <p className="mt-3 text-neutral-500 text-xs">
                Unfunded bounties remain as drafts and are not publicly listed
              </p>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
              <h3 className="mb-3 font-semibold">Bounty Summary</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-neutral-400">Title: </span>
                  <span className="text-white">{watchedValues.title}</span>
                </div>
                <div>
                  <span className="text-neutral-400">Amount: </span>
                  <span className="text-white">
                    ${watchedValues.amount} {watchedValues.currency}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400">Difficulty: </span>
                  <span className="text-white capitalize">
                    {watchedValues.difficulty}
                  </span>
                </div>
                {watchedValues.repositoryUrl && (
                  <div>
                    <span className="text-neutral-400">Repository: </span>
                    <span className="text-white">
                      {watchedValues.repositoryUrl}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-yellow-700/50 bg-yellow-900/20 p-4">
              <h4 className="mb-2 font-medium text-yellow-400">
                Important Notice
              </h4>
              <p className="text-sm text-yellow-200">
                This bounty will be created as an unfunded draft. It will not
                appear in public listings until payment is completed. You can
                fund it later from your dashboard.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepActions = () => {
    switch (currentStep) {
      case 'details':
        return (
          <div className="flex justify-end gap-2">
            <Button
              disabled={createBountyDraft.isPending}
              onClick={handleClose}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={createBountyDraft.isPending}
              onClick={handleDetailsNext}
            >
              {createBountyDraft.isPending ? 'Creating Draft...' : 'Next'}
            </Button>
          </div>
        );

      case 'payment':
        return (
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCurrentStep('details')} variant="outline">
              Back
            </Button>
          </div>
        );

      case 'review':
        return (
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCurrentStep('payment')} variant="outline">
              Back
            </Button>
            <Button disabled={publishBounty.isPending} onClick={handlePublish}>
              {publishBounty.isPending ? 'Publishing...' : 'Create Bounty'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <Drawer
        onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}
        open={open}
      >
        <DrawerContent className="border border-neutral-800 bg-neutral-900/90 backdrop-blur">
          <DrawerHeader className="px-6 pt-4">
            <DrawerTitle className="text-white text-xl">
              Create New Bounty
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-6">
            <StepIndicator currentStep={currentStep} />
            <div className="space-y-4">
              {getStepContent()}
              {getStepActions()}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      onOpenChange={(o) => {
        if (o) {
          onOpenChange(o);
        } else {
          handleClose();
        }
      }}
      open={open}
    >
      <DialogContent
        className="w-[92vw] max-w-2xl border border-neutral-800 bg-neutral-900/90 p-0 backdrop-blur sm:rounded-lg"
        showOverlay
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Create New Bounty</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <StepIndicator currentStep={currentStep} />
          <div className="space-y-4">
            {getStepContent()}
            {getStepActions()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}