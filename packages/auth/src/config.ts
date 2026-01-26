import { env } from '@bounty/env/server';
import { sendEmail } from '@bounty/email';
import { OTPVerification, ForgotPassword } from '@bounty/email';

/**
 * Shared configuration constants for Better Auth
 */
export const AUTH_CONFIG = {
  baseURL: env.BETTER_AUTH_URL,
  emailFrom: 'Bounty.new <noreply@mail.bounty.new>',
  trustedOrigins: [
    'https://bounty.new',
    'https://www.bounty.new',
    // Use specific domains instead of wildcard where possible
    ...(env.NODE_ENV === 'production'
      ? []
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'https://preview.bounty.new',
          'http://192.168.1.147:3000',
          'http://100.*.*.*:3000',
          'http://172.*.*.*:3000',
          'https://isiah-unsonant-linn.ngrok-free.dev',
        ]),
  ] as const,

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  } as const,

  deviceAuthorization: {
    expiresIn: '30m',
    interval: '5s',
  } as const,

  multiSession: {
    maximumSessions: 5,
  } as const,
} as const;

/**
 * Parse allowed device client IDs from env
 */
export function parseAllowedDeviceClientIds(): string[] {
  return env.DEVICE_AUTH_ALLOWED_CLIENT_IDS?.split(',')
    .map((id) => id.trim())
    .filter(Boolean) ?? [];
}

/**
 * Shared email sending utility with error handling
 */
export async function sendAuthEmail(options: {
  to: string;
  subject: string;
  react: React.ReactElement;
  context: string;
}): Promise<void> {
  const { to, subject, react, context } = options;

  try {
    const result = await sendEmail({
      from: AUTH_CONFIG.emailFrom,
      to,
      subject,
      react,
    });

    if (result.error) {
      console.error(`❌ Failed to send ${context} email:`, result.error);
      throw new Error(`Email send failed: ${result.error.message}`);
    }

    console.log(`✅ ${context} email sent successfully:`, result.data?.id);
  } catch (error) {
    console.error(`❌ Error in ${context}:`, error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  user: { email: string; name: string | null };
  url: string;
}): Promise<void> {
  await sendAuthEmail({
    to: params.user.email,
    subject: 'Reset your password',
    react: ForgotPassword({
      userName: params.user.name ?? 'User',
      resetUrl: params.url,
    }),
    context: 'password reset',
  });
}

/**
 * Send email verification email
 */
export async function sendEmailVerificationEmail(params: {
  user: { email: string };
  url: string;
}): Promise<void> {
  await sendAuthEmail({
    to: params.user.email,
    subject: 'Verify your email address',
    react: OTPVerification({
      code: '', // Not used for link-based verification
      email: params.user.email,
      type: 'email-verification',
      continueUrl: params.url,
    }),
    context: 'email verification',
  });
}

/**
 * Send OTP email (for sign-in, email verification, or password reset)
 * Matches Better Auth's emailOTP.sendVerificationOTP signature
 */
export async function sendOTPEmail(params: {
  email: string;
  otp: string;
  type: 'email-verification' | 'sign-in' | 'forget-password';
}): Promise<void> {
  const { email, otp, type } = params;
  const continueUrl = `${AUTH_CONFIG.baseURL}/sign-up/verify-email-address?email=${encodeURIComponent(email)}`;

  const subject =
    type === 'email-verification'
      ? 'Verify your email address'
      : type === 'sign-in'
        ? 'Sign in to Bounty.new'
        : 'Reset your password';

  await sendAuthEmail({
    to: email,
    subject,
    react: OTPVerification({
      code: otp,
      email,
      type,
      continueUrl,
    }),
    context: `OTP (${type})`,
  });
}
