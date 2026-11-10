/**
 * Validation and sanitization utilities for user inputs across the application.
 */

export const VIETNAMESE_PHONE_REGEX = /^0[35789]\d{8}$/;

/**
 * Sanitizes phone numbers by stripping whitespace, dots, dashes, and parentheses.
 * Returns empty string if input is not a valid string.
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (typeof phone !== 'string' || !phone) {
    return '';
  }
  return phone.replace(/[\s.\-()]/g, '');
}

/**
 * Validates whether a phone number is a valid 10-digit Vietnamese mobile phone number.
 * Valid prefixes: 03, 05, 07, 08, 09 followed by 8 digits.
 * Rejects empty, non-digits, invalid prefixes (e.g. 00, 01, 02, 04, 06), and wrong length.
 */
export function isValidVietnamesePhone(phone: string | null | undefined): boolean {
  if (typeof phone !== 'string' || !phone) {
    return false;
  }
  const sanitized = sanitizePhone(phone);
  return VIETNAMESE_PHONE_REGEX.test(sanitized);
}

/**
 * Checks whether a text input is non-empty and contains characters other than whitespace.
 * Rejects null, undefined, empty strings, and whitespace-only strings.
 */
export function isNonEmptyText(text: string | null | undefined): boolean {
  if (typeof text !== 'string') {
    return false;
  }
  return text.trim().length > 0;
}

/**
 * Safely clamps a numeric value within [min, max] range.
 * Handles NaN, non-numbers, negative numbers, and invalid strings by returning fallback (or min).
 */
export function clampNumber(
  val: unknown,
  min: number,
  max?: number,
  fallback?: number
): number {
  const safeFallback = fallback !== undefined ? fallback : min;

  if (val === null || val === undefined || val === '') {
    return safeFallback;
  }

  let num: number;
  if (typeof val === 'number') {
    num = val;
  } else if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) {
      return safeFallback;
    }
    num = Number(trimmed);
  } else {
    return safeFallback;
  }

  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return safeFallback;
  }

  if (num < min) {
    return min;
  }

  if (max !== undefined && max !== null && !Number.isNaN(max) && num > max) {
    return max;
  }

  return num;
}
