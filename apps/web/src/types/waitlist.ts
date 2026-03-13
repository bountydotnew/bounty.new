import type { thumbmarkResponse } from '@bounty/ui/lib/fingerprint-validation';

export type WaitlistErrorCode =
  | 'AUTH_REQUIRED'
  | 'DATABASE_UNAVAILABLE'
  | 'EMAIL_MISMATCH'
  | 'INVALID_DEVICE_FINGERPRINT'
  | 'INVALID_JSON_BODY'
  | 'INVALID_WAITLIST_REQUEST'
  | 'USER_EMAIL_REQUIRED';

export interface RateLimitInfo {
  remaining: number;
  limit: number;
  resetTime?: string;
}

export interface WaitlistSubmissionData {
  email: string;
  fingerprintData: thumbmarkResponse;
}

export interface WaitlistCookieData {
  submitted: boolean;
  timestamp: string;
  email: string;
  position?: number | null;
}

export interface WaitlistResponse {
  success: boolean;
  code?: WaitlistErrorCode;
  message?: string;
  warning?: string;
  error?: string;
  alreadyJoined?: boolean;
  position?: number | null;
  remaining?: number;
  limit?: number;
}

export interface WaitlistHookResult {
  mutate: (data: WaitlistSubmissionData) => void;
  isPending: boolean;
  success: boolean;
  position: number | null;
  setSuccess: (success: boolean) => void;
  setPosition: (position: number | null) => void;
  rateLimitInfo: RateLimitInfo | null;
}
