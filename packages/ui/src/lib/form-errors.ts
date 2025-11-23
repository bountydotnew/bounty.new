import type { FieldErrors, FieldValues } from "react-hook-form";

/**
 * Get the first error message from form errors
 */
export function getFirstError<T extends FieldValues>(
  errors: FieldErrors<T>,
): string | undefined {
  const firstErrorKey = Object.keys(errors)[0];
  if (!firstErrorKey) return undefined;

  const error = errors[firstErrorKey as keyof T];
  if (!error) return undefined;

  return error.message as string;
}

/**
 * Check if a specific field has an error
 */
export function hasFieldError<T extends FieldValues>(
  fieldName: keyof T,
  errors: FieldErrors<T>,
): boolean {
  return !!errors[fieldName];
}

/**
 * Get error message for a specific field
 */
export function getFieldError<T extends FieldValues>(
  fieldName: keyof T,
  errors: FieldErrors<T>,
): string | undefined {
  const error = errors[fieldName];
  if (!error) return undefined;
  return error.message as string;
}

/**
 * Get all error messages from form errors
 */
export function getAllErrors<T extends FieldValues>(
  errors: FieldErrors<T>,
): string[] {
  return Object.values(errors)
    .map((error) => error?.message as string)
    .filter(Boolean);
}

/**
 * Format field name for display
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
