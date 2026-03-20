import { hasProfanity, containsProfanity } from '@bounty/ui/lib/profanity';
import { trackAdminEvent } from '@bounty/track/server';
import { z } from 'zod';

export const PROFANITY_ERROR = 'Your submission contains prohibited language.';

/**
 * Creates a Zod refinement that checks for profanity and tracks blocked attempts.
 * Use this in API routers to get both validation AND admin event tracking.
 *
 * @param fieldName - Name of the field being validated (for tracking metadata)
 * @param contentType - Type of content (bounty, comment, submission, etc.)
 */
export function noProfanityWithTracking(
  fieldName: string,
  contentType: 'bounty' | 'comment' | 'submission' | 'user' | 'organization' = 'bounty'
) {
  return (val: string, ctx: z.RefinementCtx) => {
    const result = containsProfanity(val, 'word');
    if (result.hasProfanity) {
      // Track the blocked attempt (fire and forget)
      void trackAdminEvent('profanity_blocked', {
        targetType: contentType,
        description: `Profanity blocked in ${contentType} ${fieldName}`,
        metadata: {
          field: fieldName,
          contentType,
          // Don't include the actual blocked word in logs for safety
        },
      });

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PROFANITY_ERROR,
      });
    }
  };
}

/**
 * Simple profanity check refinement without tracking.
 * Use this when tracking is not needed (e.g., client-side validation).
 */
export function noProfanity() {
  return (val: string) => !hasProfanity(val);
}
