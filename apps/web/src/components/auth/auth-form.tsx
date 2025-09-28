'use client';

import { authClient } from '@bounty/auth/client';
import { Badge } from '@bounty/ui/components/badge';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import Link from '@bounty/ui/components/link';
import { cn } from '@bounty/ui/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { EmailVerification } from './email-verification';

const EXISTS_RE = /already exists|conflict|duplicate/i;

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

const signUpSchema = emailSchema.extend({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.email !== data.password, {
  message: "Email and password can't be the same",
  path: ['password'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
  /**
   * When provided (use on sign-up route), route-based flows are used instead
   * of internal step switching. Call with the email that needs verification.
   */
  onSignUpSuccess?: (email: string) => void;
}

export function AuthForm({ mode, onModeChange, onSignUpSuccess }: AuthFormProps) {
  const [step, setStep] = useState<'email' | 'password' | 'verification'>('email');
  const [email, setEmail] = useState('');
  const [isEmailAlias, setIsEmailAlias] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpData, setSignUpData] = useState<SignUpFormData | null>(null);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const checkEmailAlias = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      setIsEmailAlias(false);
      return;
    }
    const domainLower = domain.toLowerCase();
    const isGmail = domainLower === 'gmail.com' || domainLower === 'googlemail.com';

    const hasPlus = localPart.includes('+');
    const hasDotAlias = isGmail && localPart.includes('.');

    setIsEmailAlias(hasPlus || hasDotAlias);
  };

  const handleEmailSubmit = async (data: EmailFormData) => {
    setEmail(data.email);
    checkEmailAlias(data.email);

    if (mode === 'signin') {
      setStep('password');
    } else {
      // For signup, we'll handle both email and password in one step
      signUpForm.setValue('email', data.email);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({
        email,
        password: data.password,
      });

      if (result.data) {
        // Success - redirect will happen automatically via auth client
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      passwordForm.setError('password', {
        type: 'manual',
        message: error?.message || 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);

    // Preserve form state so the user can edit on the verify screen
    setSignUpData(data);
    setSignUpEmail(data.email);
    checkEmailAlias(data.email);

    let hadError = false;

    await authClient.signUp.email(
      {
        email: data.email,
        password: data.password,
        name: data.email.split('@')[0], // Use email prefix as default name
        callbackURL: '/login',
      },
      {
        onError: (ctx) => {
          hadError = true;
          const status = ctx.error?.status;
          const message = ctx.error?.message ?? '';

          if (status === 422 || EXISTS_RE.test(message)) {
            signUpForm.setError('email', {
              type: 'manual',
              message: 'An account with this email already exists. Try signing in instead.',
            });
          } else {
            signUpForm.setError('root', {
              type: 'manual',
              message: message || 'Something went wrong. Please try again.',
            });
          }
        },
      },
    );

    if (!hadError) {
      // Persist credentials so we can auto sign-in after email verification
      try {
        localStorage.setItem(
          'bounty.pendingSignIn',
          JSON.stringify({ email: data.email, password: data.password }),
        );
      } catch (e) {
        console.debug('persist pendingSignIn failed', e);
      }
      if (onSignUpSuccess) {
        // Route-based flow: push to dedicated verify page
        onSignUpSuccess(data.email);
      } else {
        // Legacy internal-step flow
        setStep('verification');
      }
    }

    setIsLoading(false);
  };

  const handleBackToEmail = () => {
    setStep('email');
    setEmail('');
    setIsEmailAlias(false);
  };

  const handleBackToSignUp = () => {
    setStep('email');
    setSignUpEmail('');
    setSignUpData(null);
    signUpForm.reset();
  };

  const handleEditSignUpInfo = () => {
    // Go back to signup form but preserve the data
    if (signUpData) {
      signUpForm.setValue('email', signUpData.email);
      signUpForm.setValue('password', signUpData.password);
    }
    setStep('email');
  };

  const handleVerificationSuccess = () => {
    // Redirect to dashboard or login
    window.location.href = '/login';
  };

  const getFieldRequirement = (field: string) => {
    switch (field) {
      case 'email':
        return 'Enter a valid email address';
      case 'password':
        return 'Must be at least 8 characters';
      default:
        return '';
    }
  };

  const getFieldError = (
    field: string,
    form: { formState: { errors: Record<string, { message?: string }> } },
  ) => {
    const error = form.formState.errors[field];
    return error?.message || '';
  };

  if (mode === 'signup') {
    if (step === 'verification') {
      return (
        <EmailVerification
          email={signUpEmail}
          onBack={handleBackToSignUp}
          onSuccess={handleVerificationSuccess}
          onEditInfo={handleEditSignUpInfo}
        />
      );
    }

    return (
      <form
        onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)}
        className="space-y-4"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                {...signUpForm.register('email')}
                type="email"
                placeholder="Enter your email"
                disabled={isLoading}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className={cn(
                  'h-10 text-base transition-all duration-200',
                  signUpForm.formState.errors.email
                    ? 'border-destructive focus-visible:border-destructive'
                    : 'focus-visible:border-primary'
                )}
                onChange={(e) => {
                  signUpForm.register('email').onChange(e);
                  checkEmailAlias(e.target.value);
                }}
              />
              {isEmailAlias && (
                <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1">
                  Email alias detected
                </Badge>
              )}
            </div>
            <AnimatePresence mode="wait">
              {focusedField === 'email' && !signUpForm.formState.errors.email ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-gray-400"
                >
                  {getFieldRequirement('email')}
                </motion.div>
              ) : signUpForm.formState.errors.email ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-destructive"
                >
                  {getFieldError('email', signUpForm)}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Input
                {...signUpForm.register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                disabled={isLoading}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className={cn(
                  'h-10 text-base pr-12 transition-all duration-200',
                  signUpForm.formState.errors.password
                    ? 'border-destructive focus-visible:border-destructive'
                    : 'focus-visible:border-primary'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <AnimatePresence mode="wait">
              {focusedField === 'password' && !signUpForm.formState.errors.password ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-gray-400"
                >
                  {getFieldRequirement('password')}
                </motion.div>
              ) : signUpForm.formState.errors.password ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-destructive"
                >
                  {getFieldError('password', signUpForm)}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isLoading ? (
            'Creating account...'
          ) : (
            <>
              Create account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <div className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-white hover:text-gray-200 underline"
          >
            Sign in
          </Link>
        </div>
      </form>
    );
  }

  // Sign in mode
  if (step === 'email') {
    return (
      <form
        onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <div className="relative">
            <Input
              {...emailForm.register('email')}
              type="email"
              placeholder="Enter your email"
              disabled={isLoading}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              className={cn(
                'h-10 text-base transition-all duration-200',
                emailForm.formState.errors.email
                  ? 'border-destructive focus-visible:border-destructive'
                  : 'focus-visible:border-primary'
              )}
            />
            {isEmailAlias && (
              <Badge className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1">
                Email alias detected
              </Badge>
            )}
          </div>
          <AnimatePresence mode="wait">
            {focusedField === 'email' && !emailForm.formState.errors.email ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-gray-400"
              >
                {getFieldRequirement('email')}
              </motion.div>
            ) : emailForm.formState.errors.email ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {getFieldError('email', emailForm)}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isLoading ? (
            'Checking...'
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <div className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link
            href="/sign-up"
            className="text-white hover:text-gray-200 underline"
          >
            Sign up
          </Link>
        </div>
      </form>
    );
  }

  // Password step for sign in
  return (
    <form
      onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
      className="space-y-4"
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-400">
          <button
            type="button"
            onClick={handleBackToEmail}
            className="text-white hover:text-gray-200 underline"
          >
            ← Back to email
          </button>
        </div>

        <div className="text-sm text-gray-200">
          Signing in as: <span className="font-medium">{email}</span>
          {isEmailAlias && (
            <Badge className="ml-2 bg-blue-600 text-white text-xs px-2 py-1">
              Email alias detected
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Input
              {...passwordForm.register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              disabled={isLoading}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              className={cn(
                'h-10 text-base pr-12 transition-all duration-200',
                passwordForm.formState.errors.password
                  ? 'border-destructive focus-visible:border-destructive'
                  : 'focus-visible:border-primary'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <AnimatePresence mode="wait">
            {focusedField === 'password' && !passwordForm.formState.errors.password ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-gray-400"
              >
                {getFieldRequirement('password')}
              </motion.div>
            ) : passwordForm.formState.errors.password ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-destructive"
              >
                {getFieldError('password', passwordForm)}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-10 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {isLoading ? (
          'Signing in...'
        ) : (
          <>
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}