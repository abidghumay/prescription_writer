const BANGLA_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

const MEAL_TIMING_MAP: Record<string, string> = {
  'after meal': 'খাবার পরে',
  'before meal': 'খাবার আগে',
  'empty stomach': 'খালি পেটে',
  'with meal': 'খাবার সাথে',
};

/**
 * Converts English/ASCII digits in a string to Bengali Unicode digits.
 * Non-digit characters (like '+', '½', spaces) are preserved.
 */
export function toBanglaDigits(str: string): string {
  return str.replace(/[0-9]/g, (digit) => BANGLA_DIGITS[digit] ?? digit);
}

/**
 * Translates standard meal timing strings to Bangla.
 * Returns empty string for null or unrecognized input.
 */
export function toBanglaMealTiming(timing: string | null): string {
  if (!timing) return '';
  return MEAL_TIMING_MAP[timing.trim().toLowerCase()] ?? '';
}

/**
 * Translates duration strings to Bangla.
 * Handles presets and arbitrary 'N days' / 'N month(s)'.
 * Returns empty string for null or unrecognized input.
 */
export function toBanglaDuration(duration: string | null): string {
  if (!duration) return '';
  const trimmed = duration.trim();

  if (trimmed.toLowerCase() === 'continue') {
    return 'চলবে';
  }

  const daysMatch = trimmed.match(/^(\d+)\s+days?$/i);
  if (daysMatch) {
    return `${toBanglaDigits(daysMatch[1])} দিন`;
  }

  const monthsMatch = trimmed.match(/^(\d+)\s+months?$/i);
  if (monthsMatch) {
    return `${toBanglaDigits(monthsMatch[1])} মাস`;
  }

  return '';
}

/**
 * Combines dose, meal timing, and duration into a formatted Bangla dose line.
 */
export function formatBanglaDoseLine(
  dose: string,
  mealTiming: string | null,
  duration: string | null,
): string {
  const banglaDose = toBanglaDigits(dose.trim());
  const banglaTiming = toBanglaMealTiming(mealTiming);
  const banglaDuration = toBanglaDuration(duration);

  return [banglaDose, banglaTiming, banglaDuration].filter(Boolean).join(' ');
}
