import { describe, it, expect } from 'vitest';

/**
 * Example unit test demonstrating the structure.
 *
 * Unit tests are best suited for:
 * - Pure utility functions
 * - Business logic without external dependencies
 * - Complex algorithms
 * - Validation functions
 *
 * Note: Repository and database integration tests are covered
 * in the integration and functional test suites.
 */

describe('Example Unit Test', () => {
  describe('String utilities', () => {
    it('should capitalize first letter', () => {
      const capitalize = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1);

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should handle empty strings', () => {
      const capitalize = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1);

      expect(capitalize('')).toBe('');
    });
  });

  describe('Number utilities', () => {
    it('should clamp values within range', () => {
      const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});
