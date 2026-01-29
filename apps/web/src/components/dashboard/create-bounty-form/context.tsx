import { createContext } from 'react';
import type { CreateBountyForm } from '@bounty/ui/lib/forms';

/**
 * CreateBountyForm State Interface
 * Contains all data needed by child components
 */
export interface CreateBountyFormState {
  /** Current form values */
  values: Partial<CreateBountyForm>;
  /** Whether form is valid */
  isValid: boolean;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether user can submit (title and amount present) */
  canSubmit: boolean;
}

/**
 * CreateBountyForm Actions Interface
 * Contains all actions that can be performed
 */
export interface CreateBountyFormActions {
  /** Update a form field */
  setFieldValue: <K extends keyof CreateBountyForm>(
    field: K,
    value: CreateBountyForm[K]
  ) => void;
  /** Submit the form */
  submit: () => void;
  /** Reset the form */
  reset: () => void;
}

/**
 * CreateBountyForm Meta Interface
 * Contains metadata and configuration
 */
export interface CreateBountyFormMeta {
  /** Form ref for external focus control */
  formRef?: React.RefObject<{ focus: () => void }>;
}

/**
 * Combined context value interface
 * Following Vercel composition patterns: state/actions/meta structure
 */
export interface CreateBountyFormContextValue {
  state: CreateBountyFormState;
  actions: CreateBountyFormActions;
  meta: CreateBountyFormMeta;
}

/**
 * Context for CreateBountyForm compound components
 * Null means we're outside the provider
 */
export const CreateBountyFormContext = createContext<CreateBountyFormContextValue | null>(null);
