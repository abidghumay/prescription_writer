/**
 * Clinical and demographic input verification utilities.
 */

/**
 * Validates Bangladeshi mobile phone numbers.
 * Supports:
 * - Local 11-digit format: 013XXXXXXXX to 019XXXXXXXX
 * - International formats: +8801XXXXXXXXX or 8801XXXXXXXXX
 */
export function isValidBangladeshiPhone(phone: string): boolean {
  if (!phone || !phone.trim()) return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(?:\+?880|880|0)?1[3-9]\d{8}$/.test(cleaned);
}

/**
 * Sanitizes and normalizes a BD phone number to the standard 11-digit format (01XXXXXXXXX).
 */
export function normalizeBangladeshiPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+880')) return cleaned.slice(3);
  if (cleaned.startsWith('880')) return cleaned.slice(2);
  return cleaned;
}

/**
 * Validates and clamps age years. Returns null if invalid or clamped integer.
 */
export function sanitizeAgeYears(
  val: string | number | null | undefined,
): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseInt(val, 10);
  if (isNaN(num) || num < 0) return 0;
  if (num > 130) return 130;
  return Math.floor(num);
}

/**
 * Validates and clamps age months (0 to 11).
 */
export function sanitizeAgeMonths(
  val: string | number | null | undefined,
): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseInt(val, 10);
  if (isNaN(num) || num < 0) return 0;
  if (num > 11) return 11;
  return Math.floor(num);
}

/**
 * Validates and clamps patient body weight (kg).
 * Weights must be strictly positive (> 0 and <= 300).
 */
export function sanitizeWeightKg(
  val: string | number | null | undefined,
): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num) || num <= 0) return null;
  if (num > 300) return 300;
  return Math.round(num * 10) / 10;
}
