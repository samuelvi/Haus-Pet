import { describe, it, expect } from 'vitest';
import { Password } from '../../../app/api/domain/auth/value-objects/password';

describe('Password Value Object', () => {

  describe('fromHash()', () => {

    it('should create password from valid hash', () => {
      const hash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';
      const password = Password.fromHash(hash);
      expect(password.getHash()).toBe(hash);
    });

    it('should create password from bcrypt hash', () => {
      // Real bcrypt hash example
      const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
      const password = Password.fromHash(hash);
      expect(password.getHash()).toBe(hash);
    });

    it('should throw error for empty string', () => {
      expect(() => Password.fromHash(''))
        .toThrow('Password hash cannot be empty');
    });

    it('should throw error for whitespace only', () => {
      expect(() => Password.fromHash('   '))
        .toThrow('Password hash cannot be empty');
    });

    it('should accept hash with spaces (non-trimmed)', () => {
      // Note: Hash might contain spaces in theory, but real bcrypt hashes don't
      const hash = '$2b$10$hash with spaces';
      const password = Password.fromHash(hash);
      expect(password.getHash()).toBe(hash);
    });
  });

  describe('isValidPlainPassword()', () => {

    describe('Valid passwords', () => {

      it('should accept password with uppercase, lowercase, and number', () => {
        expect(Password.isValidPlainPassword('Password123')).toBe(true);
      });

      it('should accept strong password', () => {
        expect(Password.isValidPlainPassword('StrongPass123!')).toBe(true);
      });

      it('should accept password with special characters', () => {
        expect(Password.isValidPlainPassword('Pass123!@#$')).toBe(true);
      });

      it('should accept very long password', () => {
        expect(Password.isValidPlainPassword('VeryLongPassword1234567890ABCDEFGHIJKLMNOP')).toBe(true);
      });

      it('should accept password exactly 8 characters', () => {
        expect(Password.isValidPlainPassword('Pass123A')).toBe(true);
      });

      it('should accept password with multiple numbers', () => {
        expect(Password.isValidPlainPassword('Password1234567890')).toBe(true);
      });

      it('should accept password with multiple uppercase', () => {
        expect(Password.isValidPlainPassword('PASSWord123')).toBe(true);
      });

      it('should accept password with spaces', () => {
        expect(Password.isValidPlainPassword('Pass Word 123')).toBe(true);
      });
    });

    describe('Invalid passwords', () => {

      it('should reject password shorter than 8 characters', () => {
        expect(Password.isValidPlainPassword('Pass1')).toBe(false);
      });

      it('should reject password with only 7 characters', () => {
        expect(Password.isValidPlainPassword('Pass12A')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(Password.isValidPlainPassword('')).toBe(false);
      });

      it('should reject password without uppercase', () => {
        expect(Password.isValidPlainPassword('password123')).toBe(false);
      });

      it('should reject password without lowercase', () => {
        expect(Password.isValidPlainPassword('PASSWORD123')).toBe(false);
      });

      it('should reject password without numbers', () => {
        expect(Password.isValidPlainPassword('PasswordABC')).toBe(false);
      });

      it('should reject password with only lowercase', () => {
        expect(Password.isValidPlainPassword('abcdefghij')).toBe(false);
      });

      it('should reject password with only uppercase', () => {
        expect(Password.isValidPlainPassword('ABCDEFGHIJ')).toBe(false);
      });

      it('should reject password with only numbers', () => {
        expect(Password.isValidPlainPassword('12345678')).toBe(false);
      });

      it('should reject password with only special characters', () => {
        expect(Password.isValidPlainPassword('!@#$%^&*()')).toBe(false);
      });

      it('should reject password with uppercase and numbers only (no lowercase)', () => {
        expect(Password.isValidPlainPassword('PASSWORD123')).toBe(false);
      });

      it('should reject password with lowercase and numbers only (no uppercase)', () => {
        expect(Password.isValidPlainPassword('password123')).toBe(false);
      });

      it('should reject password with uppercase and lowercase only (no numbers)', () => {
        expect(Password.isValidPlainPassword('PasswordTest')).toBe(false);
      });
    });

    describe('Edge cases', () => {

      it('should handle null input', () => {
        expect(Password.isValidPlainPassword(null as any)).toBe(false);
      });

      it('should handle undefined input', () => {
        expect(Password.isValidPlainPassword(undefined as any)).toBe(false);
      });

      it('should reject whitespace only', () => {
        expect(Password.isValidPlainPassword('        ')).toBe(false);
      });

      it('should accept password with unicode characters and requirements met', () => {
        expect(Password.isValidPlainPassword('Pass123犬')).toBe(true);
      });

      it('should accept password with emoji and requirements met', () => {
        expect(Password.isValidPlainPassword('Pass123🔒')).toBe(true);
      });
    });
  });

  describe('getHash()', () => {

    it('should return the hash value', () => {
      const hash = '$2b$10$test_hash_value';
      const password = Password.fromHash(hash);
      expect(password.getHash()).toBe(hash);
    });

    it('should return exact hash without modification', () => {
      const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
      const password = Password.fromHash(hash);
      expect(password.getHash()).toBe(hash);
    });
  });

  describe('equals()', () => {

    it('should return true for same hash', () => {
      const hash = '$2b$10$test_hash';
      const password1 = Password.fromHash(hash);
      const password2 = Password.fromHash(hash);
      expect(password1.equals(password2)).toBe(true);
    });

    it('should return false for different hashes', () => {
      const hash1 = '$2b$10$test_hash_1';
      const hash2 = '$2b$10$test_hash_2';
      const password1 = Password.fromHash(hash1);
      const password2 = Password.fromHash(hash2);
      expect(password1.equals(password2)).toBe(false);
    });

    it('should return false for completely different hashes', () => {
      const hash1 = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
      const hash2 = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOP';
      const password1 = Password.fromHash(hash1);
      const password2 = Password.fromHash(hash2);
      expect(password1.equals(password2)).toBe(false);
    });
  });

  describe('Immutability', () => {

    it('should protect hash with readonly modifier (TypeScript compile-time)', () => {
      const originalHash = '$2b$10$test_hash';
      const password = Password.fromHash(originalHash);

      // TypeScript prevents modification at compile time
      // At runtime, JavaScript allows modification via bracket notation
      // This test documents that we rely on TypeScript for immutability

      expect(password.getHash()).toBe(originalHash);
    });
  });

  describe('Password Requirements Documentation', () => {

    it('should document minimum length requirement of 8 characters', () => {
      expect(Password.isValidPlainPassword('Pass123')).toBe(false); // 7 chars
      expect(Password.isValidPlainPassword('Pass123A')).toBe(true);  // 8 chars
    });

    it('should document requirement for at least one uppercase letter', () => {
      expect(Password.isValidPlainPassword('password123')).toBe(false);
      expect(Password.isValidPlainPassword('Password123')).toBe(true);
    });

    it('should document requirement for at least one lowercase letter', () => {
      expect(Password.isValidPlainPassword('PASSWORD123')).toBe(false);
      expect(Password.isValidPlainPassword('Password123')).toBe(true);
    });

    it('should document requirement for at least one number', () => {
      expect(Password.isValidPlainPassword('PasswordABC')).toBe(false);
      expect(Password.isValidPlainPassword('Password123')).toBe(true);
    });
  });
});
