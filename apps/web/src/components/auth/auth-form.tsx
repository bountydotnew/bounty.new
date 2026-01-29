/**
 * AuthForm Component
 *
 * Refactored to use Vercel composition patterns:
 * - Explicit variant components instead of mode switching
 * - No boolean props for mode selection
 * - Each variant is a dedicated component
 *
 * @example
 * ```tsx
 * // New API with explicit variants
 * import { SignInForm, SignUpForm, AddAccountForm } from '@/components/auth/auth-form';
 *
 * <SignInForm callbackUrl="/dashboard" />
 * <SignUpForm />
 * <AddAccountForm />
 * ```
 *
 * @module
 */

// Re-export the new explicit variants
export { SignInForm } from './sign-in-form';
export { SignUpForm } from './sign-up-form';
export { AddAccountForm } from './add-account-form';

// Re-export shared utilities
export {
  isSafeRedirectUrl,
  useEmailPasswordForm,
  EmailField,
  PasswordField,
  SubmitButton,
} from './shared';

// Re-export types
export type { SignInFormProps } from './sign-in-form';
export type { SignUpFormProps } from './sign-up-form';
export type { EmailFieldProps, PasswordFieldProps, SubmitButtonProps } from './shared';

/**
 * Backward-compatible AuthForm component
 *
 * Maintains the old API for gradual migration.
 * Use the new explicit variant components for new code.
 *
 * @deprecated Use SignInForm, SignUpForm, or AddAccountForm instead
 */
import { SignInForm } from './sign-in-form';
import { AddAccountForm } from './add-account-form';

interface AuthFormProps {
  callbackUrl?: string;
  isAddingAccount?: boolean;
}

export default function AuthForm({
  callbackUrl,
  isAddingAccount,
}: AuthFormProps) {
  // For backward compatibility, render SignInForm by default
  // New code should use the explicit variants directly
  if (isAddingAccount) {
    return <AddAccountForm />;
  }

  return <SignInForm callbackUrl={callbackUrl} showHeader />;
}
