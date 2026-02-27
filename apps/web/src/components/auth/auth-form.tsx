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
export { AddAccountForm } from './add-account-form';

