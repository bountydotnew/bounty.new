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
import { Stepper, Step, StepperNavigation, useStepper } from '@bounty/ui/components/stepper';
import { useDrafts } from '@bounty/ui/hooks/use-drafts';
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
import { DollarSign, Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { MarkdownTextarea } from '@/components/bounty/markdown-editor';
import { trpc } from '@/utils/trpc';
import { PaymentMethodSetup } from '@/components/stripe/payment-method-setup';
import { stripe } from '@bounty/api/src/lib/stripe';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

interface CreateBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId?: string;
  initialValues?: Partial<CreateBountyForm>;
  redirectOnClose?: string;
  replaceOnSuccess?: boolean;
  mode?: 'create' | 'github-import';
  githubData?: {
    title?: string;
    description?: string;
    repositoryUrl?: string;
    issueUrl?: string;
  };
}

type CreateBountyStep = 'details' | 'payments' | 'finishing' | 'github-details' | 'github-review';

export function CreateBountyModal({
  open,
  onOpenChange,
  draftId,
  initialValues,
  redirectOnClose,
  replaceOnSuccess,
  mode = 'create',
  githubData,
}: CreateBountyModalProps) {
  const queryClient = useQueryClient();
  const { getDraft, deleteActiveDraft } = useDrafts();
  const router = useRouter();

  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'link'>('link');

  const form = useForm<CreateBountyForm>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      ...createBountyDefaults,
      ...(initialValues || {}),
      ...(githubData || {}),
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = form;

  const paymentMethodId = watch("paymentMethodId");

  // Load draft data if draftId is provided
  useEffect(() => {
    if (draftId && open) {
      const draft = getDraft(draftId);
      if (draft) {
        setValue('title', draft.title);
        setValue('description', draft.description);
        toast.success('Draft loaded! Complete the remaining details.');
      }
    }
  }, [draftId, open, getDraft, setValue]);

  useEffect(() => {
    if (open && initialValues) {
      reset({ ...createBountyDefaults, ...initialValues });
    }
  }, [open, initialValues, reset]);
  const createBounty = useMutation({
    ...trpc.bounties.createBounty.mutationOptions(),
    onSuccess: (result) => {
      if (draftId) {
        deleteActiveDraft();
      }
      toast.success('Bounty created successfully!');

      // Invalidate all bounty-related queries to trigger refetch
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
      toast.error(`Failed to create bounty: ${error.message}`);
      if (error.message.toLowerCase().includes('duplicate')) {
        toast.error('Bounty with this title already exists');
      }
    },
  });

  const onSubmit = handleSubmit((data: CreateBountyForm) => {
    const formattedData = formatFormData.createBounty(data);
    createBounty.mutate(formattedData);
  });

  // const tagsInput = watch("tags");
  // const handleTagsChange = (value: string) => {
  //   const tags = parseTagsInput(value);
  //   setValue("tags", tags);
  // };

  const handleClose = () => {
    if (!(isSubmitting || createBounty.isPending)) {
      reset();
      onOpenChange(false);
      if (redirectOnClose) {
        router.push(redirectOnClose);
      }
    }
  };

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  const isMobile = useMediaQuery('(max-width: 768px)');

  // Step validation functions
  const validateCurrentStep = async () => {
    if (mode === 'create') {
      switch (currentStep) {
        case 0: // Details step
          return await form.trigger(['title', 'description', 'difficulty']);
        case 1: // Payments step
          return await form.trigger(['amount', 'currency']);
        case 2: // Finishing touches step
          return await form.trigger(['repositoryUrl', 'issueUrl']);
        default:
          return true;
      }
    } else {
      switch (currentStep) {
        case 0: // GitHub details step
          return await form.trigger(['repositoryUrl', 'issueUrl']);
        case 1: // GitHub review step
          return await form.trigger(['title', 'description']);
        case 2: // Additional step
          return await form.trigger(['amount', 'currency', 'difficulty']);
        default:
          return true;
      }
    }
  };

  const handleStepChange = async (step: number) => {
    const isValid = await validateCurrentStep();
    if (isValid || step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  if (isMobile) {
    return (
      <Drawer
        onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}
        open={open}
      >
        <DrawerContent className="border border-neutral-800 bg-neutral-900/90 backdrop-blur">
          <DrawerHeader className="px-6 pt-4">
            <DrawerTitle className="text-white text-xl">
              {mode === 'github-import' ? 'Import from GitHub' : 'Create New Bounty'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-6">
            <BountyCreationStepper
              mode={mode}
              form={form}
              onSubmit={onSubmit}
              currentStep={currentStep}
              onStepChange={handleStepChange}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              isSubmitting={isSubmitting || createBounty.isPending}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      onOpenChange={(open) => (open ? onOpenChange(open) : handleClose())}
      open={open}
    >
      <DialogContent
        className="w-[92vw] max-w-2xl border border-neutral-800 bg-neutral-900/90 p-0 backdrop-blur sm:rounded-lg"
        showOverlay
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">
            {mode === 'github-import' ? 'Import from GitHub' : 'Create New Bounty'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <BountyCreationStepper
            mode={mode}
            form={form}
            onSubmit={onSubmit}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            isSubmitting={isSubmitting || createBounty.isPending}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stepper component for bounty creation
interface BountyCreationStepperProps {
  mode: 'create' | 'github-import';
  form: any;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onPrev: () => void;
  paymentMethod: 'card' | 'link';
  setPaymentMethod: (method: 'card' | 'link') => void;
  isSubmitting: boolean;
}

function BountyCreationStepper({
  mode,
  form,
  onSubmit,
  currentStep,
  onStepChange,
  onNext,
  onPrev,
  paymentMethod,
  setPaymentMethod,
  isSubmitting,
}: BountyCreationStepperProps) {
  const { control, formState: { errors } } = form;

  const createSteps = [
    <Step key="details" title="Bounty Details" description="Describe what needs to be done">
      <div className="space-y-4">
        <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="space-y-2">
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
      </div>
    </Step>,

    <Step key="payments" title="Payment Setup" description="Set bounty amount and payment method">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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

        <div className="space-y-3">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('link')}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                paymentMethod === 'link'
                  ? 'border-neutral-600 bg-neutral-800/60'
                  : 'border-neutral-800 hover:bg-neutral-900/60'
              }`}
            >
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <div className="font-medium text-white text-sm">Payment Link</div>
                <div className="text-neutral-400 text-xs">Stripe-hosted payment</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                paymentMethod === 'card'
                  ? 'border-neutral-600 bg-neutral-800/60'
                  : 'border-neutral-800 hover:bg-neutral-900/60'
              }`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500">
                <span className="text-white text-xs">💳</span>
              </div>
              <div>
                <div className="font-medium text-white text-sm">Card Entry</div>
                <div className="text-neutral-400 text-xs">Direct card input</div>
              </div>
            </button>
          </div>
        </div>

        {paymentMethod === 'link' && (
          <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
            <p className="text-green-400 text-sm">
              💡 Payment links provide a better user experience and handle all payment processing securely through Stripe.
            </p>
          </div>
        )}
      </div>
    </Step>,

    <Step key="finishing" title="Finishing Touches" description="Add optional repository and issue links">
      <div className="space-y-4">
        <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
          <h4 className="font-medium text-blue-400 text-sm mb-2">Ready to create your bounty?</h4>
          <p className="text-blue-300 text-sm">
            Review your details and click "Create Bounty" to publish your bounty to the community.
          </p>
        </div>
      </div>
    </Step>
  ];

  const githubSteps = [
    <Step key="github-details" title="GitHub Details" description="Connect your repository and issue">
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
          <Github className="h-5 w-5 text-white" />
          <span className="font-medium text-white text-sm">Import from GitHub</span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repositoryUrl">Repository URL *</Label>
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

        <div className="space-y-2">
          <Label htmlFor="issueUrl">Issue/PR URL *</Label>
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
    </Step>,

    <Step key="github-review" title="Review Imported Info" description="Review and edit the imported details">
      <div className="space-y-4">
        <div className="space-y-2">
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

        <div className="space-y-2">
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
      </div>
    </Step>,

    <Step key="final-setup" title="Final Setup" description="Set amount, difficulty and payment method">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="space-y-3">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('link')}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                paymentMethod === 'link'
                  ? 'border-neutral-600 bg-neutral-800/60'
                  : 'border-neutral-800 hover:bg-neutral-900/60'
              }`}
            >
              <DollarSign className="h-5 w-5 text-green-400" />
              <div>
                <div className="font-medium text-white text-sm">Payment Link</div>
                <div className="text-neutral-400 text-xs">Stripe-hosted payment</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                paymentMethod === 'card'
                  ? 'border-neutral-600 bg-neutral-800/60'
                  : 'border-neutral-800 hover:bg-neutral-900/60'
              }`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500">
                <span className="text-white text-xs">💳</span>
              </div>
              <div>
                <div className="font-medium text-white text-sm">Card Entry</div>
                <div className="text-neutral-400 text-xs">Direct card input</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Step>
  ];

  const steps = mode === 'github-import' ? githubSteps : createSteps;

  return (
    <form onSubmit={onSubmit}>
      <Stepper currentStep={currentStep} onStepChange={onStepChange}>
        {steps}
      </Stepper>

      <StepperNavigation
        onNext={onNext}
        onBack={onPrev}
        nextDisabled={isSubmitting}
        backDisabled={isSubmitting}
      >
        {currentStep === steps.length - 1 && (
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? 'Creating...' : 'Create Bounty'}
          </Button>
        )}
      </StepperNavigation>
    </form>
  );
}
