/**
 * Authentication Security Examples and Templates
 *
 * This file contains secure patterns for authentication flows
 * that prevent common vulnerabilities like:
 * - Open redirect attacks
 * - Password storage in localStorage
 * - Improper async handling
 */

import { validateAndSanitizeRedirectUrl, validateCallbackUrl } from './security';
import { LINKS } from '@/constants';

/**
 * Secure Sign-up Page Template
 *
 * This template shows how to handle redirects securely in sign-up flows
 */
export const secureSignUpPageExample = `
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { validateAndSanitizeRedirectUrl, validateCallbackUrl } from '@/utils/security';
import { LINKS } from '@/constants';

export default function SecureSignUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // SECURE: Validate redirect_url and callback params before use
  const redirectUrl = validateAndSanitizeRedirectUrl(
    searchParams.get('redirect_url'),
    '/login'
  );

  const callbackUrl = validateCallbackUrl(
    searchParams.get('callback'),
    LINKS.DASHBOARD
  );

  const handleSignUp = async (data: { email: string; password: string }) => {
    try {
      // SECURE: Never store passwords in localStorage!
      // Instead, use secure session-based authentication

      await authClient.signUp.email({
        email: data.email,
        password: data.password,
      });

      // SECURE: Use validated redirect URL
      if (onSignUpSuccess) {
        onSignUpSuccess(data.email);
      } else {
        // Use the validated redirect URL
        router.push(redirectUrl);
      }
    } catch (error) {
      // Handle error appropriately
      console.error('Sign up failed:', error);
    }
  };

  // ... rest of component
}
`;

/**
 * Secure Email Verification Page Template
 */
export const secureEmailVerificationExample = `
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { validateAndSanitizeRedirectUrl } from '@/utils/security';

export default function SecureEmailVerificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get('email');

  // SECURE: Validate redirectUrl before using in router.push
  const redirectUrl = validateAndSanitizeRedirectUrl(
    searchParams.get('redirectUrl'),
    '/' // Safe fallback
  );

  const handleVerificationComplete = () => {
    // SECURE: Use validated redirect URL
    router.push(redirectUrl);
  };

  // SECURE: Auto sign-in without storing passwords
  const attemptAutoSignIn = useCallback(async () => {
    // Instead of storing passwords, use secure session tokens
    // or email verification tokens that expire quickly

    try {
      // Example: Use a secure verification token
      const token = searchParams.get('token');
      if (token && email) {
        await authClient.verifyEmail({
          email,
          token,
        });
        // Redirect after successful verification
        router.push(redirectUrl);
      }
    } catch (error) {
      console.debug('Auto sign-in failed:', error);
      // Don't expose error details to user
    }
  }, [email, redirectUrl]);

  // ... rest of component
}
`;

/**
 * Security Best Practices for Authentication
 */
export const authSecurityBestPractices = {
  redirectValidation: {
    description: 'Always validate redirect URLs to prevent open redirect attacks',
    implementation: validateAndSanitizeRedirectUrl,
    example: `
      // BAD: Direct use of user input
      const redirect = searchParams.get('redirect');
      router.push(redirect); // Vulnerable to open redirects!

      // GOOD: Validate and sanitize
      const redirect = validateAndSanitizeRedirectUrl(
        searchParams.get('redirect'),
        '/safe-default'
      );
      router.push(redirect); // Safe
    `
  },

  passwordStorage: {
    description: 'Never store passwords in localStorage or any client-side storage',
    badExample: `
      // BAD: Never do this!
      localStorage.setItem('password', password);
    `,
    goodExample: `
      // GOOD: Use secure session-based authentication
      await authClient.signIn.email({ email, password });
      // Password is sent securely to server, never stored client-side
    `
  },

  asyncHandling: {
    description: 'Properly handle async authentication APIs',
    badExample: `
      // BAD: Synchronous call to async API
      if (!PublicKeyCredential.isConditionalMediationAvailable()) {
        return;
      }
    `,
    goodExample: `
      // GOOD: Proper async handling
      const checkPasskeySupport = async () => {
        try {
          if (!PublicKeyCredential?.isConditionalMediationAvailable) {
            return;
          }

          const isAvailable = await PublicKeyCredential.isConditionalMediationAvailable();
          if (isAvailable) {
            await authClient.signIn.passkey({ autoFill: true });
          }
        } catch (error) {
          console.debug('Passkey check failed:', error);
        }
      };

      checkPasskeySupport();
    `
  }
};

/**
 * Security checklist for authentication flows
 */
export const authSecurityChecklist = [
  'Validate all redirect URLs before use',
  'Never store passwords in localStorage',
  'Use HTTPS for all authentication endpoints',
  'Implement proper CSRF protection',
  'Use secure session management',
  'Validate all user inputs',
  'Handle async authentication APIs properly',
  'Implement rate limiting for authentication attempts',
  'Use secure password requirements',
  'Implement proper error handling without exposing sensitive information'
];