'use client';

import { useCallback } from 'react';
import { containsProfanity } from '@bounty/ui/lib/profanity';
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

interface UseProfanityOptions {
  /** Match mode: 'word' matches word prefixes, 'substring' matches anywhere */
  mode?: 'word' | 'substring';
  /** Custom error message */
  message?: string;
}

/**
 * Hook for profanity validation in forms
 *
 * @example
 * const { validateFields } = useProfanity();
 *
 * const onSubmit = handleSubmit(async (data) => {
 *   const isClean = validateFields(
 *     { title: data.title, description: data.description },
 *     setError
 *   );
 *   if (!isClean) return;
 *   await mutation.mutateAsync(data);
 * });
 */
export function useProfanity(options: UseProfanityOptions = {}) {
  const {
    mode = 'word',
    message = 'Your submission contains prohibited language.',
  } = options;

  /**
   * Validate a single field value
   * @returns Error message if profanity found, undefined otherwise
   */
  const validateField = useCallback(
    (value: string): string | undefined => {
      const result = containsProfanity(value, mode);
      return result.hasProfanity ? message : undefined;
    },
    [mode, message]
  );

  /**
   * Validate a field and set form error if profanity found
   * @returns true if valid, false if profanity detected
   */
  const validateAndSetError = useCallback(
    <F extends FieldValues>(
      fieldName: Path<F>,
      value: string,
      setError: UseFormSetError<F>
    ): boolean => {
      const error = validateField(value);
      if (error) {
        setError(fieldName, { type: 'profanity', message: error });
        return false;
      }
      return true;
    },
    [validateField]
  );

  /**
   * Validate multiple fields at once
   * @returns true if all valid, false if any profanity detected
   */
  const validateFields = useCallback(
    <F extends FieldValues>(
      fields: Partial<Record<Path<F>, string>>,
      setError: UseFormSetError<F>
    ): boolean => {
      let isValid = true;
      for (const [fieldName, value] of Object.entries(fields)) {
        if (value && typeof value === 'string') {
          if (!validateAndSetError(fieldName as Path<F>, value, setError)) {
            isValid = false;
          }
        }
      }
      return isValid;
    },
    [validateAndSetError]
  );

  /**
   * Check if text contains profanity (without setting form errors)
   */
  const checkProfanity = useCallback(
    (text: string) => containsProfanity(text, mode),
    [mode]
  );

  return {
    validateField,
    validateAndSetError,
    validateFields,
    checkProfanity,
    containsProfanity: checkProfanity,
  } as const;
}
