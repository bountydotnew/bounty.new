'use client';

import { useEmailPasswordForm, EmailField, PasswordField, SubmitButton } from './shared';
import { Button } from '@bounty/ui/components/button';
import { useRouter } from 'next/navigation';

export interface SignUpFormProps {
  /**
   * Whether to show the header with title and description
   */
  showHeader?: boolean;
  /**
   * Whether to show the "Sign in" link at the bottom
   */
  showSignInLink?: boolean;
}

/**
 * SignUpForm
 *
 * Explicit variant component for sign up functionality.
 * Replaces the `mode="signup"` boolean prop pattern.
 *
 * @example
 * ```tsx
 * <SignUpForm />
 * ```
 */
export function SignUpForm({
  showHeader = true,
  showSignInLink = true,
}: SignUpFormProps) {
  const router = useRouter();
  const {
    email,
    setEmail,
    password,
    setPassword,
    isPending,
    handleSignUp,
  } = useEmailPasswordForm();

  return (
    <div className="w-full max-w-md space-y-6">
      {showHeader && (
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Create account
          </h1>
          <p className="text-gray-400 text-sm">
            Enter your email below to create your account
          </p>
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        <EmailField
          value={email}
          onChange={setEmail}
          disabled={isPending}
        />

        <PasswordField
          value={password}
          onChange={setPassword}
          disabled={isPending}
          showForgotPassword={false}
        />

        <SubmitButton isPending={isPending}>
          {isPending ? 'Creating account...' : 'Create account'}
        </SubmitButton>
      </form>

      {showSignInLink && (
        <div className="text-center">
          <Button
            variant="text"
            onClick={() => router.push('/login')}
            disabled={isPending}
            className="text-sm text-gray-400 hover:text-white"
            type="button"
          >
            Already have an account? Sign in
          </Button>
        </div>
      )}
    </div>
  );
}
