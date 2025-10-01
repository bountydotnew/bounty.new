/**
 * Security utilities for validating and sanitizing user input
 * Prevents open redirect vulnerabilities and other security issues
 */

import { LINKS } from '@/constants';

/**
 * Validates and sanitizes redirect URLs to prevent open redirect vulnerabilities
 * @param redirectUrl - The URL to validate and sanitize
 * @param fallback - Fallback URL if validation fails
 * @returns Safe redirect URL
 */
export function validateAndSanitizeRedirectUrl(
  redirectUrl: string | null,
  fallback: string = LINKS.DASHBOARD
): string {
  if (!redirectUrl) {
    return fallback;
  }

  try {
    // Decode URL in case it's encoded
    const decodedUrl = decodeURIComponent(redirectUrl);

    // Check for obvious malicious patterns
    if (
      decodedUrl.startsWith('//') ||
      decodedUrl.includes('://') ||
      decodedUrl.startsWith('javascript:') ||
      decodedUrl.startsWith('data:') ||
      decodedUrl.startsWith('vbscript:')
    ) {
      return fallback;
    }

    // Only allow relative paths that start with a single '/'
    if (!decodedUrl.startsWith('/') || decodedUrl.startsWith('//')) {
      return fallback;
    }

    // Additional validation: construct URL with current origin to verify
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    if (currentOrigin) {
      const testUrl = new URL(decodedUrl, currentOrigin);

      // Ensure the URL is same-origin
      if (testUrl.origin !== currentOrigin) {
        return fallback;
      }
    }

    return decodedUrl;
  } catch (error) {
    // If any parsing fails, return fallback
    console.debug('Redirect URL validation failed:', error);
    return fallback;
  }
}

/**
 * Validates callback URLs for OAuth flows
 * @param callbackUrl - The callback URL to validate
 * @param fallback - Fallback URL if validation fails
 * @returns Safe callback URL
 */
export function validateCallbackUrl(
  callbackUrl: string | null,
  fallback: string = LINKS.DASHBOARD
): string {
  return validateAndSanitizeRedirectUrl(callbackUrl, fallback);
}

/**
 * Allowed redirect patterns - whitelist of safe routes
 */
const ALLOWED_REDIRECT_PATTERNS = [
  /^\/dashboard$/,
  /^\/bounties$/,
  /^\/bounty\/[a-zA-Z0-9-]+$/,
  /^\/profile\/[a-zA-Z0-9-]+$/,
  /^\/settings$/,
  /^\/bookmarks$/,
  /^\/$/
];

/**
 * Validates redirect URL against whitelist of allowed patterns
 * @param redirectUrl - The URL to validate
 * @param fallback - Fallback URL if validation fails
 * @returns Safe redirect URL
 */
export function validateRedirectWithWhitelist(
  redirectUrl: string | null,
  fallback: string = LINKS.DASHBOARD
): string {
  if (!redirectUrl) {
    return fallback;
  }

  const sanitizedUrl = validateAndSanitizeRedirectUrl(redirectUrl, fallback);

  // If sanitization already failed, return fallback
  if (sanitizedUrl === fallback && redirectUrl !== fallback) {
    return fallback;
  }

  // Check against whitelist
  const isAllowed = ALLOWED_REDIRECT_PATTERNS.some(pattern =>
    pattern.test(sanitizedUrl)
  );

  return isAllowed ? sanitizedUrl : fallback;
}