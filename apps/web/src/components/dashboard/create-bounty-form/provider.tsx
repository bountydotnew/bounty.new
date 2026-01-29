'use client';

import { useMemo, ReactNode, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateBountyFormContext,
  type CreateBountyFormContextValue,
  type CreateBountyFormState,
  type CreateBountyFormActions,
} from './context';
import type { CreateBountyForm as TCreateBountyForm } from '@bounty/ui/lib/forms';
import {
  createBountyDefaults,
  createBountySchema,
} from '@bounty/ui/lib/forms';

interface CreateBountyFormProviderProps {
  children: ReactNode;
  /** Form submission handler */
  onSubmit: (data: TCreateBountyForm & { repositoryUrl?: string; issueUrl?: string }) => void;
  /** Default values */
  defaultValues?: TCreateBountyForm;
}

/**
 * CreateBountyForm Provider
 *
 * Wraps the form with state and actions following Vercel composition patterns.
 * The provider is the ONLY place that knows how state is managed.
 * Child components only depend on the context interface.
 *
 * @example
 * ```tsx
 * <CreateBountyFormProvider onSubmit={handleSubmit}>
 *   <CreateBountyForm.TitleChip />
 *   <CreateBountyForm.PriceChip />
 *   <CreateBountyForm.Description />
 *   <CreateBountyForm.SubmitButton />
 * </CreateBountyFormProvider>
 * ```
 */
export function CreateBountyFormProvider({
  children,
  onSubmit,
  defaultValues,
}: CreateBountyFormProviderProps) {
  const form = useForm<TCreateBountyForm>({
    resolver: zodResolver(createBountySchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      ...createBountyDefaults,
      description: '',
      ...defaultValues,
    },
  });

  const { handleSubmit: formHandleSubmit, watch, reset } = form;
  const title = watch('title');
  const amount = watch('amount');

  const formRef = useRef({ focus: () => {} });

  // Determine if form can be submitted
  const canSubmit = !!(title && amount);

  // Handle submit
  const submit = () => {
    formHandleSubmit((data) => {
      onSubmit(data);
    })();
  };

  // Reset form
  const resetForm = () => {
    reset();
  };

  // Set field value action
  const setFieldValue = (field: keyof TCreateBountyForm, value: any) => {
    form.setValue(field, value);
  };

  // State object
  const state: CreateBountyFormState = useMemo(
    () => ({
      values: watch(),
      isValid: form.formState.isValid,
      isSubmitting: form.formState.isSubmitting,
      canSubmit,
    }),
    [watch, form.formState.isValid, form.formState.isSubmitting, canSubmit]
  );

  // Actions object
  const actions: CreateBountyFormActions = useMemo(
    () => ({
      setFieldValue,
      submit,
      reset: resetForm,
    }),
    [setFieldValue, submit, resetForm]
  );

  // Meta object
  const meta = useMemo(
    () => ({
      formRef,
    }),
    []
  );

  const contextValue: CreateBountyFormContextValue = useMemo(
    () => ({
      state,
      actions,
      meta,
    }),
    [state, actions, meta]
  );

  return (
    <CreateBountyFormContext.Provider value={contextValue}>
      {children}
    </CreateBountyFormContext.Provider>
  );
}
