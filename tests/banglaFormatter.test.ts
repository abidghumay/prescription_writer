import { describe, it, expect } from 'vitest';
import {
  toBanglaDigits,
  toBanglaMealTiming,
  toBanglaDuration,
  formatBanglaDoseLine,
} from '../src/shared/banglaFormatter';

describe('toBanglaDigits', () => {
  it('converts simple English digits to Bangla digits', () => {
    expect(toBanglaDigits('123')).toBe('১২৩');
    expect(toBanglaDigits('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
  });

  it('converts digits mixed with symbols without modifying symbols', () => {
    expect(toBanglaDigits('1+0+1')).toBe('১+০+১');
    expect(toBanglaDigits('1-0-1')).toBe('১-০-১');
  });

  it('preserves half-dose symbol', () => {
    expect(toBanglaDigits('½+0+½')).toBe('½+০+½');
  });

  it('returns empty string for empty input', () => {
    expect(toBanglaDigits('')).toBe('');
  });
});

describe('toBanglaMealTiming', () => {
  it('correctly maps all four preset meal timings', () => {
    expect(toBanglaMealTiming('After meal')).toBe('খাবার পরে');
    expect(toBanglaMealTiming('Before meal')).toBe('খাবার আগে');
    expect(toBanglaMealTiming('Empty stomach')).toBe('খালি পেটে');
    expect(toBanglaMealTiming('With meal')).toBe('খাবার সাথে');
  });

  it('returns empty string for null', () => {
    expect(toBanglaMealTiming(null)).toBe('');
  });

  it('returns empty string for unrecognized strings', () => {
    expect(toBanglaMealTiming('Random text')).toBe('');
    expect(toBanglaMealTiming('Bedtime')).toBe('');
  });
});

describe('toBanglaDuration', () => {
  it('translates preset duration strings', () => {
    expect(toBanglaDuration('3 days')).toBe('৩ দিন');
    expect(toBanglaDuration('5 days')).toBe('৫ দিন');
    expect(toBanglaDuration('7 days')).toBe('৭ দিন');
    expect(toBanglaDuration('14 days')).toBe('১৪ দিন');
    expect(toBanglaDuration('1 month')).toBe('১ মাস');
    expect(toBanglaDuration('Continue')).toBe('চলবে');
  });

  it('translates arbitrary N days', () => {
    expect(toBanglaDuration('10 days')).toBe('১০ দিন');
    expect(toBanglaDuration('1 day')).toBe('১ দিন');
    expect(toBanglaDuration('21 days')).toBe('২১ দিন');
  });

  it('translates arbitrary N months', () => {
    expect(toBanglaDuration('2 months')).toBe('২ মাস');
    expect(toBanglaDuration('6 months')).toBe('৬ মাস');
  });

  it('returns empty string for null or unrecognized durations', () => {
    expect(toBanglaDuration(null)).toBe('');
    expect(toBanglaDuration('')).toBe('');
    expect(toBanglaDuration('indefinitely')).toBe('');
  });
});

describe('formatBanglaDoseLine', () => {
  it('formats full dose line with dose, timing, and duration', () => {
    expect(formatBanglaDoseLine('1+0+1', 'After meal', '7 days')).toBe(
      '১+০+১ খাবার পরে ৭ দিন',
    );
  });

  it('formats dose only when timing and duration are null', () => {
    expect(formatBanglaDoseLine('1+0+1', null, null)).toBe('১+০+১');
  });

  it('formats dose and timing only when duration is null', () => {
    expect(formatBanglaDoseLine('1+1+1', 'Before meal', null)).toBe(
      '১+১+১ খাবার আগে',
    );
  });

  it('formats dose and duration only when timing is null', () => {
    expect(formatBanglaDoseLine('½+0+½', null, '5 days')).toBe('½+০+½ ৫ দিন');
  });

  it('handles half-dose token formatting correctly', () => {
    expect(formatBanglaDoseLine('½+0+½', 'After meal', '3 days')).toBe(
      '½+০+½ খাবার পরে ৩ দিন',
    );
  });
});
