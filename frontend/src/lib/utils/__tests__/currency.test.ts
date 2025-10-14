import { toNumber, formatCurrency, formatCurrencyFromString } from '../currency';

describe('currency utilities', () => {
  describe('toNumber', () => {
    it('should convert string number to number', () => {
      expect(toNumber('123')).toBe(123);
      expect(toNumber('123.45')).toBe(123.45);
    });

    it('should return number as-is', () => {
      expect(toNumber(123)).toBe(123);
      expect(toNumber(123.45)).toBe(123.45);
    });

    it('should return 0 for null', () => {
      expect(toNumber(null)).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(toNumber(undefined)).toBe(0);
    });

    it('should return 0 for invalid string', () => {
      expect(toNumber('invalid')).toBe(0);
      expect(toNumber('')).toBe(0);
      expect(toNumber('abc')).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(toNumber('-123')).toBe(-123);
      expect(toNumber(-123)).toBe(-123);
    });

    it('should handle decimal numbers', () => {
      expect(toNumber('0.5')).toBe(0.5);
      expect(toNumber('123.456')).toBe(123.456);
    });

    it('should handle zero', () => {
      expect(toNumber('0')).toBe(0);
      expect(toNumber(0)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format number as Korean currency', () => {
      const formatted = formatCurrency(1000000);
      expect(formatted).toMatch(/1,000,000/);
      expect(formatted).toContain('₩');
    });

    it('should format string number as Korean currency', () => {
      const formatted = formatCurrency('1000000');
      expect(formatted).toMatch(/1,000,000/);
      expect(formatted).toContain('₩');
    });

    it('should handle zero', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toContain('₩');
      expect(formatted).toMatch(/0/);
    });

    it('should handle negative numbers', () => {
      const formatted = formatCurrency(-1000);
      expect(formatted).toContain('₩');
      expect(formatted).toMatch(/1,000/);
    });

    it('should handle decimal numbers by rounding', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('₩');
      // Korean currency doesn't usually show decimals
      expect(formatted).toMatch(/1,235/);
    });
  });

  describe('formatCurrencyFromString', () => {
    it('should format valid string number', () => {
      const formatted = formatCurrencyFromString('1000000');
      expect(formatted).toMatch(/1,000,000/);
      expect(formatted).toContain('₩');
    });

    it('should handle null', () => {
      const formatted = formatCurrencyFromString(null);
      expect(formatted).toContain('₩');
      expect(formatted).toMatch(/0/);
    });

    it('should handle undefined', () => {
      const formatted = formatCurrencyFromString(undefined);
      expect(formatted).toContain('₩');
      expect(formatted).toMatch(/0/);
    });

    it('should handle invalid string', () => {
      const formatted = formatCurrencyFromString('invalid');
      expect(formatted).toContain('₩');
      expect(formatted).toMatch(/0/);
    });

    it('should handle number input', () => {
      const formatted = formatCurrencyFromString(5000);
      expect(formatted).toContain('₩');
      expect(formatted).toMatch(/5,000/);
    });

    it('should handle empty string', () => {
      const formatted = formatCurrencyFromString('');
      expect(formatted).toContain('₩');
      expect(formatted).toMatch(/0/);
    });
  });
});
