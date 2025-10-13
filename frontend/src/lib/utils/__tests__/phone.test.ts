import { formatPhoneNumber, unformatPhoneNumber, isValidPhoneNumber } from '../phone';

describe('formatPhoneNumber', () => {
  it('should format mobile numbers correctly', () => {
    expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678');
    expect(formatPhoneNumber('01011112222')).toBe('010-1111-2222');
  });

  it('should handle partial input', () => {
    expect(formatPhoneNumber('010')).toBe('010');
    expect(formatPhoneNumber('01012')).toBe('010-12');
    expect(formatPhoneNumber('0101234')).toBe('010-1234');
  });

  it('should limit to 11 digits', () => {
    expect(formatPhoneNumber('010123456789999')).toBe('010-1234-5678');
  });

  it('should remove non-digit characters', () => {
    expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678');
    expect(formatPhoneNumber('010 1234 5678')).toBe('010-1234-5678');
    expect(formatPhoneNumber('010.1234.5678')).toBe('010-1234-5678');
  });

  it('should handle empty string', () => {
    expect(formatPhoneNumber('')).toBe('');
  });
});

describe('unformatPhoneNumber', () => {
  it('should extract only digits', () => {
    expect(unformatPhoneNumber('010-1234-5678')).toBe('01012345678');
    expect(unformatPhoneNumber('010 1234 5678')).toBe('01012345678');
  });

  it('should handle already unformatted numbers', () => {
    expect(unformatPhoneNumber('01012345678')).toBe('01012345678');
  });

  it('should handle empty string', () => {
    expect(unformatPhoneNumber('')).toBe('');
  });
});

describe('isValidPhoneNumber', () => {
  describe('mobile numbers', () => {
    it('should validate 010 numbers', () => {
      expect(isValidPhoneNumber('010-1234-5678')).toBe(true);
      expect(isValidPhoneNumber('01012345678')).toBe(true);
      expect(isValidPhoneNumber('010-123-5678')).toBe(true); // 10 digits
    });

    it('should validate 011 numbers', () => {
      expect(isValidPhoneNumber('011-1234-5678')).toBe(true);
      expect(isValidPhoneNumber('01112345678')).toBe(true);
    });

    it('should validate 016, 017, 018, 019 numbers', () => {
      expect(isValidPhoneNumber('016-1234-5678')).toBe(true);
      expect(isValidPhoneNumber('017-1234-5678')).toBe(true);
      expect(isValidPhoneNumber('018-1234-5678')).toBe(true);
      expect(isValidPhoneNumber('019-1234-5678')).toBe(true);
    });
  });

  describe('landline numbers', () => {
    it('should validate Seoul numbers (02)', () => {
      expect(isValidPhoneNumber('02-1234-5678')).toBe(true);
      expect(isValidPhoneNumber('021234567')).toBe(true); // 9 digits
    });

    it('should validate area code numbers', () => {
      expect(isValidPhoneNumber('031-1234-5678')).toBe(true); // Gyeonggi
      expect(isValidPhoneNumber('051-1234-5678')).toBe(true); // Busan
      expect(isValidPhoneNumber('064-1234-5678')).toBe(true); // Jeju
    });
  });

  describe('invalid numbers', () => {
    it('should reject numbers with wrong prefix', () => {
      expect(isValidPhoneNumber('020-1234-5678')).toBe(false);
      expect(isValidPhoneNumber('015-1234-5678')).toBe(false);
    });

    it('should reject numbers with wrong length', () => {
      expect(isValidPhoneNumber('010-123-456')).toBe(false); // Too short
      expect(isValidPhoneNumber('010-1234-56789')).toBe(false); // Too long
    });

    it('should reject empty string', () => {
      expect(isValidPhoneNumber('')).toBe(false);
    });

    it('should reject non-numeric input', () => {
      expect(isValidPhoneNumber('abc-defg-hijk')).toBe(false);
    });
  });
});
