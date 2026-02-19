import type { thumbmarkResponse } from "@bounty/ui/lib/fingerprint-validation";

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
}

interface WaitlistResponse {
	message?: string;
	warning?: string;
	remaining: number;
	limit: number;
}

export interface WaitlistHookResult {
	mutate: (data: WaitlistSubmissionData) => void;
	isPending: boolean;
	success: boolean;
	setSuccess: (success: boolean) => void;
	rateLimitInfo: RateLimitInfo | null;
}
