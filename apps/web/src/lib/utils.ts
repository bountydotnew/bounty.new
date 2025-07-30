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

export function getCookie(name: string): string | null {
  return document.cookie.split('; ').find(row => row.startsWith(`${name}=`))?.split('=')[1] || null;
}

export function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
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
