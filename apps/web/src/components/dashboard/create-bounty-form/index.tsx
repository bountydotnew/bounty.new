'use client';

import { CreateBountyFormProvider } from './provider';

/**
 * CreateBountyForm Compound Component
 *
 * Provides a flexible, composable API for creating bounties.
 * Following Vercel composition patterns with explicit components.
 *
 * @example
 * ```tsx
 * // New API with compound components
 * import { CreateBountyForm } from '@/components/dashboard/create-bounty-form';
 *
 * <CreateBountyForm.Provider onSubmit={handleSubmit}>
 *   {/* Your form components here *\/}
 * </CreateBountyForm.Provider>
 * ```
 */
export const CreateBountyForm = {
  Provider: CreateBountyFormProvider,
};

// Re-export types
export type {
  CreateBountyFormContextValue,
  CreateBountyFormState,
  CreateBountyFormActions,
  CreateBountyFormMeta,
} from './context';
