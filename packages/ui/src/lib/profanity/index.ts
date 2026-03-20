/**
 * Profanity detection library
 *
 * Provides utilities for detecting and filtering profanity in user-generated content.
 * Handles Unicode homoglyphs, fullwidth characters, and mathematical variants.
 *
 * @example
 * // Check text for profanity
 * import { containsProfanity, hasProfanity } from '@bounty/ui/lib/profanity';
 *
 * if (hasProfanity(userInput)) {
 *   // Block submission
 * }
 *
 * @example
 * // Use with Zod schemas
 * import { noProfanity } from '@bounty/ui/lib/profanity';
 * import { z } from 'zod';
 *
 * const schema = z.object({
 *   title: noProfanity(z.string().min(1).max(200)),
 * });
 */

export {
  containsProfanity,
  hasProfanity,
  noProfanity,
  noProfanityStrict,
} from './validator';

export { replaceHomoglyphs } from './homoglyphs';

export { profanities, profanityArray } from './blocklist';
