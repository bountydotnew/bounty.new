import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date consistently for SSR/hydration compatibility
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  // Handle null, undefined, or invalid dates
  if (!date) {
    return "Invalid date";
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Check if the date object is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid date";
  }

  // Use consistent locale and options to prevent hydration mismatches
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function getCookie(name: string): string | null {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] || null
  );
}

export function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

/**
 * Format currency consistently
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with consistent locale
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
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
  if (num >= 1000000000000) {
    const trillions = num / 1000000000000;
    return trillions >= 10 
      ? `${Math.floor(trillions)}T` 
      : `${(trillions).toFixed(1)}T`;
  }
  if (num >= 1000000000) {
    const billions = num / 1000000000;
    return billions >= 10 
      ? `${Math.floor(billions)}B` 
      : `${(billions).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    const millions = num / 1000000;
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
  return num.toLocaleString("en-US");
}

export function formatRelativeTime(input: string | Date | number | null | undefined): string {
  if (!input) return "Invalid date";
  const now = new Date();
  const date = typeof input === "string" || typeof input === "number" ? new Date(input) : input;
  if (isNaN(date.getTime())) return "Invalid date";

  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 5) return "now";
  if (seconds < 60) return `${seconds} second${seconds > 1 ? "s" : ""} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "last week";
  if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;

  const months = Math.floor(days / 30);
  if (months === 1) return "last month";
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;

  const years = Math.floor(days / 365);
  if (years === 1) return "last year";
  return `${years} year${years > 1 ? "s" : ""} ago`;
}
