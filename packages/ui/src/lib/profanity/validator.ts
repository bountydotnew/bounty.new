import { z } from 'zod';
import { replaceHomoglyphs } from './homoglyphs';
import { profanities } from './blocklist';

/**
 * Sanitize a string by removing combining diacritics and normalizing whitespace
 */
function sanitizeString(str: string): string {
  return str
    .replace(/[\u0300-\u036f]/g, '') // Remove combining diacritics
    .trim()
    .replace(/\s{3,}/g, '  '); // Collapse excessive whitespace
}

/**
 * Check if text contains profanity
 *
 * @param text - The text to check
 * @param mode - 'word' matches word prefixes, 'substring' matches anywhere in words
 * @returns Object with hasProfanity boolean and optional matched word
 */
export function containsProfanity(
  text: string,
  mode: 'word' | 'substring' = 'word'
): { hasProfanity: boolean; matched?: string } {
  // Split on common punctuation and whitespace to get words
  const words = text
    .toLowerCase()
    .split(/[.,"/#!?$%^&*;:{}=\-_`~()\s\n]+/g)
    .filter(Boolean)
    .map((str) => replaceHomoglyphs(sanitizeString(str)));

  for (const profanity of profanities) {
    const found = words.some((word) =>
      mode === 'word' ? word.startsWith(profanity) : word.includes(profanity)
    );
    if (found) {
      return { hasProfanity: true, matched: profanity };
    }
  }

  return { hasProfanity: false };
}

/**
 * Check if text contains profanity (simple boolean version)
 */
export function hasProfanity(
  text: string,
  mode: 'word' | 'substring' = 'word'
): boolean {
  return containsProfanity(text, mode).hasProfanity;
}

/**
 * Zod refinement helper that adds profanity validation to a string schema
 *
 * @param schema - The Zod string schema to refine
 * @param message - Custom error message (optional)
 * @returns Zod schema with profanity validation
 *
 * @example
 * const titleSchema = noProfanity(z.string().min(1).max(200));
 */
export function noProfanity(
  schema: z.ZodString,
  message = 'Your submission contains prohibited language.'
) {
  return schema.refine((val) => !containsProfanity(val, 'word').hasProfanity, {
    message,
  });
}

/**
 * Create a profanity-checked string schema with substring matching
 *
 * @param schema - The Zod string schema to refine
 * @param message - Custom error message (optional)
 * @returns Zod schema with strict profanity validation
 */
export function noProfanityStrict(
  schema: z.ZodString,
  message = 'Your submission contains prohibited language.'
) {
  return schema.refine(
    (val) => !containsProfanity(val, 'substring').hasProfanity,
    { message }
  );
}
