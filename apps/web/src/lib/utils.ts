import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date consistently for SSR/hydration compatibility
 */
export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  // Handle null, undefined, or invalid dates
  if (!date) {
    return 'Invalid date';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if the date object is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Use consistent locale and options to prevent hydration mismatches
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
}

/**
 * Format currency consistently
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with consistent locale
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Parse number with consistent locale
 */
export function parseNumber(num: string): number {
  return Number(num);
}
