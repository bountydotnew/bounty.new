import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date consistently for SSR/hydration compatibility
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  // Handle null, undefined, or invalid dates
  if (!date) {
    return 'Invalid date';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if the date object is valid
  if (Number.isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  // Use consistent locale and options to prevent hydration mismatches
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function getCookie(name: string): string | null {
  return (
    (document as Document).cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`))
      ?.split('=')[1] || null
  );
}

export function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  (document as Document).cookie = `${name}=${value};${expires};path=/`;
}

/**
 * Format currency consistently
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
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

/**
 * Format large numbers with M+ suffix for millions
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000_000) {
    const trillions = num / 1_000_000_000_000;
    return trillions >= 10
      ? `${Math.floor(trillions)}T`
      : `${(trillions).toFixed(1)}T`;
  }
  if (num >= 1_000_000_000) {
    const billions = num / 1_000_000_000;
    return billions >= 10
      ? `${Math.floor(billions)}B`
      : `${(billions).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    return millions >= 10
      ? `${Math.floor(millions)}M`
      : `${(millions).toFixed(1)}M`;
  }
  if (num >= 1000) {
    const thousands = num / 1000;
    return thousands >= 10
      ? `${Math.floor(thousands)}K`
      : `${(thousands).toFixed(1)}K`;
  }
  return num.toLocaleString('en-US');
}

/**
 * Format date with long month format (e.g., "January 15, 2024")
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(dateObj.getTime())) {
    return '';
  }

  return dateObj.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format currency with compact notation (K, M, B)
 * e.g., 1500 -> "$1.50K", 1500000 -> "$1.50M"
 */
export function formatCompactCurrency(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

/**
 * Format price with dynamic precision for crypto/token prices
 * Uses more decimals for smaller values
 */
export function formatPrecisionPrice(num: number): string {
  if (num < 0.0001) {
    return `$${num.toFixed(8)}`;
  }
  if (num < 0.01) {
    return `$${num.toFixed(6)}`;
  }
  if (num < 1) {
    return `$${num.toFixed(4)}`;
  }
  return `$${num.toFixed(2)}`;
}

/**
 * Format number with compact notation (K, M, B) - no currency symbol
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

/**
 * Format token balance from string with null handling
 */
export function formatTokenBalance(balance: string | null | undefined): string {
  if (!balance) {
    return '0';
  }
  const num = Number.parseFloat(balance);
  if (Number.isNaN(num)) {
    return '0';
  }

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Format currency for billing (K only, conditional decimals)
 * e.g., 1000 -> "$1k", 1500 -> "$1.5k"
 */
export function formatBillingCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${amount}`;
}

/**
 * Format a price string with commas (for display)
 */
export function formatPriceString(price: string | null | undefined): string {
  if (!price) {
    return '';
  }
  const num = Number.parseFloat(price);
  if (Number.isNaN(num)) {
    return price;
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * GitHub helper utilities
 * These are helper functions for GitHub-related operations.
 * For GitHub API functions, see @bounty/api/driver/github
 */

// Regex for extracting owner/repo from GitHub URLs
export const GITHUB_URL_REGEX = /github\.com\/([^/]+)\/([^/]+)/;

/**
 * Convert number to formatted string with commas (e.g., 1500 -> "1,500", 1500.50 -> "1,500.50")
 */
export function stringifyValue(value: number): string {
  // Only show decimals if the value has them
  if (Number.isInteger(value)) {
    return value.toLocaleString('en-US');
  }
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse user input for currency/number values
 * Handles "1,500", "1500", "$1,500", "1,500.50", etc.
 */
export function parseInputValue(input: string): number {
  const cleaned = input.replace(/[$,\s]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Helper to extract owner/repo from repo string (format: "owner/repo")
 * @param repo - Repository string in format "owner/repo"
 * @returns Object with owner and repo, or null if invalid format
 */
export function parseRepo(
  repo: string
): { owner: string; repo: string } | null {
  const parts = repo.split('/');
  if (parts.length === 2) {
    return { owner: parts[0] ?? '', repo: parts[1] ?? '' };
  }
  return null;
}
