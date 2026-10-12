import { describe, it, expect } from 'vitest';
import {
  isValidBangladeshiPhone,
  normalizeBangladeshiPhone,
  sanitizeAgeYears,
  sanitizeAgeMonths,
  sanitizeWeightKg,
} from '../src/shared/validation';

describe('isValidBangladeshiPhone', () => {
  it('accepts valid 11-digit local BD phone numbers', () => {
    expect(isValidBangladeshiPhone('01711223344')).toBe(true);
    expect(isValidBangladeshiPhone('01819876543')).toBe(true);
    expect(isValidBangladeshiPhone('01912345678')).toBe(true);
    expect(isValidBangladeshiPhone('01300000000')).toBe(true);
    expect(isValidBangladeshiPhone('01400000000')).toBe(true);
    expect(isValidBangladeshiPhone('01500000000')).toBe(true);
    expect(isValidBangladeshiPhone('01600000000')).toBe(true);
  });

  it('accepts valid international format with +88 or 88', () => {
    expect(isValidBangladeshiPhone('+8801711223344')).toBe(true);
    expect(isValidBangladeshiPhone('8801819876543')).toBe(true);
    expect(isValidBangladeshiPhone('+880 1711-223344')).toBe(true);
  });

  it('rejects invalid numbers', () => {
    expect(isValidBangladeshiPhone('')).toBe(false);
    expect(isValidBangladeshiPhone('01211223344')).toBe(false); // 012 is invalid in BD
    expect(isValidBangladeshiPhone('0171122334')).toBe(false); // too short
    expect(isValidBangladeshiPhone('017112233445')).toBe(false); // too long
    expect(isValidBangladeshiPhone('abcdefghijk')).toBe(false);
    expect(isValidBangladeshiPhone('12345678901')).toBe(false);
  });

  it('normalizes numbers to standard 11-digit format', () => {
    expect(normalizeBangladeshiPhone('+8801711223344')).toBe('01711223344');
    expect(normalizeBangladeshiPhone('8801819876543')).toBe('01819876543');
    expect(normalizeBangladeshiPhone('01912345678')).toBe('01912345678');
  });
});

describe('sanitizeAgeYears & sanitizeAgeMonths', () => {
  it('prevents negative age values', () => {
    expect(sanitizeAgeYears(-5)).toBe(0);
    expect(sanitizeAgeYears('-10')).toBe(0);
    expect(sanitizeAgeMonths(-2)).toBe(0);
  });

  it('clamps to valid clinical ranges', () => {
    expect(sanitizeAgeYears(45)).toBe(45);
    expect(sanitizeAgeYears(150)).toBe(130);
    expect(sanitizeAgeMonths(6)).toBe(6);
    expect(sanitizeAgeMonths(15)).toBe(11);
  });

  it('handles empty inputs', () => {
    expect(sanitizeAgeYears('')).toBeNull();
    expect(sanitizeAgeYears(null)).toBeNull();
    expect(sanitizeAgeMonths('')).toBeNull();
  });
});

describe('sanitizeWeightKg', () => {
  it('rejects negative or zero weights', () => {
    expect(sanitizeWeightKg(-10)).toBeNull();
    expect(sanitizeWeightKg(0)).toBeNull();
    expect(sanitizeWeightKg('-5.5')).toBeNull();
  });

  it('accepts valid weights and clamps ceiling', () => {
    expect(sanitizeWeightKg(65.5)).toBe(65.5);
    expect(sanitizeWeightKg('12.4')).toBe(12.4);
    expect(sanitizeWeightKg(400)).toBe(300);
  });
});
