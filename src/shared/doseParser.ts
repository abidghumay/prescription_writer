/**
 * Expands quick dose tokens into clinical dose notation.
 * e.g., '101' -> '1+0+1', '111' -> '1+1+1', '001' -> '0+0+1'
 * 'h0h' or 'h01' where 'h' expands to '½': e.g., 'h0h' -> '½+0+½'
 */
export function parseDoseToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Already formatted (e.g., contains '+')
  if (trimmed.includes('+')) {
    return trimmed;
  }

  // Handle 3-digit numeric quick tokens: '101', '111', '001', '010', '201', etc.
  if (/^\d{3}$/.test(trimmed)) {
    return `${trimmed[0]}+${trimmed[1]}+${trimmed[2]}`;
  }

  // Handle 4-digit numeric quick tokens: '1111', etc.
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed[0]}+${trimmed[1]}+${trimmed[2]}+${trimmed[3]}`;
  }

  // Handle half tokens with 'h': e.g. 'h0h' -> '½+0+½', '10h' -> '1+0+½'
  if (/^[0-9hH]{3}$/.test(trimmed)) {
    const chars = trimmed
      .split('')
      .map((c) => (c.toLowerCase() === 'h' ? '½' : c));
    return `${chars[0]}+${chars[1]}+${chars[2]}`;
  }

  // Otherwise return as free text
  return trimmed;
}
