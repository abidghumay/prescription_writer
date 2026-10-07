import { describe, it, expect } from 'vitest';
import { parseDoseToken } from '../src/shared/doseParser';

describe('Dose Token Parser', () => {
  it('expands 3-digit shorthand into morning+noon+night notation', () => {
    expect(parseDoseToken('101')).toBe('1+0+1');
    expect(parseDoseToken('111')).toBe('1+1+1');
    expect(parseDoseToken('001')).toBe('0+0+1');
    expect(parseDoseToken('010')).toBe('0+1+0');
  });

  it('handles half dose tokens using h', () => {
    expect(parseDoseToken('h0h')).toBe('½+0+½');
    expect(parseDoseToken('10h')).toBe('1+0+½');
  });

  it('leaves already formatted or free text strings intact', () => {
    expect(parseDoseToken('1+0+1')).toBe('1+0+1');
    expect(parseDoseToken('½+0+½')).toBe('½+0+½');
    expect(parseDoseToken('As needed')).toBe('As needed');
  });
});
