/**
 * useBilling Hook (Deprecated)
 *
 * This file is kept for backward compatibility.
 * The actual implementation has moved to apps/web/src/hooks/use-billing.ts
 * where it can access the tRPC client directly.
 *
 * @deprecated Import from '@/hooks/use-billing' in the web app instead
 */

// Stub implementation for type exports only
// The web app provides the actual implementation via its own useBilling hook
export const useBillingClientStub = () => {
	throw new Error(
		"useBilling must be imported from @/hooks/use-billing in the web app, not from @bounty/ui/hooks",
	);
};

// Re-export types for TypeScript
export type {
	BillingHookResult,
	ExtendedCustomerState,
	FeatureState,
	PendingAction,
	UsageMetadata,
} from "@bounty/types";
