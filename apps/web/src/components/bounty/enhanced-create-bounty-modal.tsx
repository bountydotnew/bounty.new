'use client';

import type { AppRouter } from '@bounty/api';
import { Button } from '@bounty/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Input } from '@bounty/ui/components/input';
import { Label } from '@bounty/ui/components/label';
import { useDrafts } from '@bounty/ui/hooks/use-drafts';
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
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CreditCard,
  DollarSign,
  FileText,
  Sparkles
} from 'lucide-react';
import { MarkdownTextarea } from '@/components/bounty/markdown-editor';
import { ImprovedPaymentModal } from '../stripe/improved-payment-modal';
import { trpc } from '@/utils/trpc';

interface EnhancedCreateBountyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftId?: string;
  initialValues?: Partial<CreateBountyForm>;
  redirectOnClose?: string;
  replaceOnSuccess?: boolean;
}

type BountyStep = 'details' | 'review' | 'payment';

export function EnhancedCreateBountyModal({
  open,
  onOpenChange,
  draftId,
  initialValues,
  redirectOnClose,
  replaceOnSuccess,
}: EnhancedCreateBountyModalProps) {
  const [currentStep, setCurrentStep] = useState<BountyStep>('details');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBounty, setCreatedBounty] = useState<any>(null);

  const queryClient = useQueryClient();
  const { getDraft, deleteActiveDraft } = useDrafts();
  const router = useRouter();

  const form = useForm<CreateBountyForm>({
    resolver: zodResolver(createBountySchema),
    defaultValues: {
      ...createBountyDefaults,
      ...(initialValues || {}),
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

  const watchedValues = watch();

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

      setCreatedBounty(result.data);
      setCurrentStep('payment');

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['bounties'],
        type: 'all',
      });

      toast.success('Bounty created! Now let\'s fund it.');
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

  const handleClose = () => {
    if (!(isSubmitting || createBounty.isPending)) {
      reset();
      setCurrentStep('details');
      setCreatedBounty(null);
      onOpenChange(false);
      if (redirectOnClose) {
        router.push(redirectOnClose);
      }
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    handleClose();

    if (createdBounty?.id) {
      const href = `/bounty/${createdBounty.id}${replaceOnSuccess ? '?from=gh-issue' : ''}`;
      if (replaceOnSuccess) {
        router.replace(href);
      } else {
        router.push(href);
      }
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const formatAmount = (amount: string, currency: string) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(num);
  };

  return (
    <>
      <Dialog
        onOpenChange={(newOpen) => newOpen ? onOpenChange(newOpen) : handleClose()}
        open={open}
      >
        <DialogContent className="w-[95vw] max-w-2xl border border-neutral-800 bg-neutral-900/95 p-0 backdrop-blur-xl">
          <DialogHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-white text-xl">
                    Create New Bounty
                  </DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    {currentStep === 'details' && 'Fill in the bounty details'}
                    {currentStep === 'review' && 'Review your bounty before creating'}
                    {currentStep === 'payment' && 'Fund your bounty to make it active'}
                  </DialogDescription>
                </div>
              </div>

              {/* Step Indicator */}
              <div className="flex gap-2">
                {['details', 'review', 'payment'].map((step, index) => (
                  <div
                    key={step}
                    className={`h-2 w-8 rounded-full transition-colors ${
                      currentStep === step
                        ? 'bg-blue-500'
                        : index < ['details', 'review', 'payment'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              {currentStep === 'details' && (
                <motion.div
                  key="details"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={stepVariants}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <form className="space-y-4 px-6 pb-6">
                    <div className="space-y-2 rounded-lg bg-neutral-900/50 p-4">
                      <Label htmlFor="title" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Title *
                      </Label>
                      <Controller
                        control={control}
                        name="title"
                        render={({ field }) => (
                          <Input
                            {...field}
                            autoComplete="off"
                            className={`bg-neutral-800 border-neutral-700 ${errors.title ? 'border-red-500' : ''}`}
                            id="title"
                            placeholder="Enter a clear, descriptive title"
                          />
                        )}
                      />
                      {errors.title && (
                        <p className="mt-1 text-red-400 text-sm">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 rounded-lg bg-neutral-900/50 p-4">
                      <Label htmlFor="description">Description *</Label>
                      <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-3">
                        <Controller
                          control={control}
                          name="description"
                          render={({ field }) => (
                            <MarkdownTextarea
                              className={
                                errors.description ? 'border-red-500' : 'border-transparent'
                              }
                              id="description"
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={(val) => field.onChange(val)}
                              placeholder="Describe what needs to be done, requirements, and deliverables..."
                              value={field.value}
                            />
                          )}
                        />
                      </div>
                      {errors.description && (
                        <p className="mt-1 text-red-400 text-sm">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 rounded-lg bg-neutral-900/50 p-4">
                        <Label htmlFor="amount" className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Amount *
                        </Label>
                        <Controller
                          control={control}
                          name="amount"
                          render={({ field }) => (
                            <Input
                              {...field}
                              autoComplete="off"
                              className={`bg-neutral-800 border-neutral-700 ${errors.amount ? 'border-red-500' : ''}`}
                              id="amount"
                              placeholder="100.00"
                            />
                          )}
                        />
                        {errors.amount && (
                          <p className="mt-1 text-red-400 text-sm">
                            {errors.amount.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2 rounded-lg bg-neutral-900/50 p-4">
                        <Label htmlFor="currency">Currency</Label>
                        <Controller
                          control={control}
                          name="currency"
                          render={({ field }) => (
                            <select
                              {...field}
                              className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-white"
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

                    <div className="space-y-2 rounded-lg bg-neutral-900/50 p-4">
                      <Label htmlFor="difficulty">Difficulty *</Label>
                      <Controller
                        control={control}
                        name="difficulty"
                        render={({ field }) => (
                          <select
                            {...field}
                            className={`w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-white ${
                              errors.difficulty ? 'border-red-500' : ''
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
                        <p className="mt-1 text-red-400 text-sm">
                          {errors.difficulty.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 rounded-lg bg-neutral-900/50 p-4">
                      <Label htmlFor="repositoryUrl">Repository URL (Optional)</Label>
                      <Controller
                        control={control}
                        name="repositoryUrl"
                        render={({ field }) => (
                          <Input
                            {...field}
                            autoComplete="off"
                            className={`bg-neutral-800 border-neutral-700 ${errors.repositoryUrl ? 'border-red-500' : ''}`}
                            id="repositoryUrl"
                            placeholder="https://github.com/user/repo"
                            type="url"
                          />
                        )}
                      />
                      {errors.repositoryUrl && (
                        <p className="mt-1 text-red-400 text-sm">
                          {errors.repositoryUrl.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 rounded-lg bg-neutral-900/50 p-4">
                      <Label htmlFor="issueUrl">Issue URL (Optional)</Label>
                      <Controller
                        control={control}
                        name="issueUrl"
                        render={({ field }) => (
                          <Input
                            {...field}
                            autoComplete="off"
                            className={`bg-neutral-800 border-neutral-700 ${errors.issueUrl ? 'border-red-500' : ''}`}
                            id="issueUrl"
                            placeholder="https://github.com/user/repo/issues/123"
                            type="url"
                          />
                        )}
                      />
                      {errors.issueUrl && (
                        <p className="mt-1 text-red-400 text-sm">
                          {errors.issueUrl.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        onClick={handleClose}
                        type="button"
                        variant="outline"
                        className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => setCurrentStep('review')}
                        type="button"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Review
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {currentStep === 'review' && (
                <motion.div
                  key="review"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={stepVariants}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="space-y-4 px-6 pb-6">
                    {/* Amount Display */}
                    <div className="rounded-xl border border-neutral-700 bg-gradient-to-r from-neutral-800 to-neutral-700 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-neutral-400 text-sm">Bounty Amount</p>
                          <p className="font-bold text-white text-3xl">
                            {formatAmount(watchedValues.amount, watchedValues.currency)}
                          </p>
                        </div>
                        <div className="rounded-full bg-green-500/20 p-3">
                          <DollarSign className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                    </div>

                    {/* Bounty Details */}
                    <div className="space-y-3">
                      <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                        <h4 className="mb-2 font-semibold text-white">Title</h4>
                        <p className="text-neutral-300">{watchedValues.title}</p>
                      </div>

                      <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                        <h4 className="mb-2 font-semibold text-white">Description</h4>
                        <p className="text-neutral-300 text-sm leading-relaxed">
                          {watchedValues.description.slice(0, 200)}
                          {watchedValues.description.length > 200 && '...'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                          <h4 className="mb-1 font-semibold text-white text-sm">Difficulty</h4>
                          <p className="text-neutral-300 capitalize">{watchedValues.difficulty}</p>
                        </div>
                        <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4">
                          <h4 className="mb-1 font-semibold text-white text-sm">Currency</h4>
                          <p className="text-neutral-300">{watchedValues.currency}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between gap-3 pt-4">
                      <Button
                        onClick={() => setCurrentStep('details')}
                        type="button"
                        variant="outline"
                        className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        onClick={onSubmit}
                        disabled={createBounty.isPending}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                      >
                        {createBounty.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Creating...
                          </div>
                        ) : (
                          <>
                            Create Bounty
                            <CheckCircle className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 'payment' && createdBounty && (
                <motion.div
                  key="payment"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={stepVariants}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="px-6 pb-6 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="mb-2 font-bold text-white text-xl">
                      Bounty Created Successfully!
                    </h3>
                    <p className="mb-6 text-neutral-400">
                      Now let's fund your bounty to make it active and visible to developers.
                    </p>

                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 mb-6">
                      <p className="text-blue-300 text-sm">
                        💡 Funding your bounty makes it active and attractive to contributors
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleClose}
                        variant="outline"
                        className="flex-1 border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                      >
                        Skip for Now
                      </Button>
                      <Button
                        onClick={() => setShowPaymentModal(true)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Fund Bounty
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {showPaymentModal && createdBounty && (
        <ImprovedPaymentModal
          open={showPaymentModal}
          onOpenChange={(open) => {
            setShowPaymentModal(open);
            if (!open) {
              handlePaymentComplete();
            }
          }}
          bountyId={createdBounty.id}
          bountyTitle={createdBounty.title}
          bountyAmount={parseFloat(createdBounty.amount)}
          bountyCurrency={createdBounty.currency}
          recipientName={createdBounty.creator?.name || 'Unknown'}
          recipientUsername={createdBounty.creator?.name || 'unknown'}
        />
      )}
    </>
  );
}