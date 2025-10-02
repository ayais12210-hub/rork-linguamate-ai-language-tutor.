import { waitFor } from '../tests/utils';

describe('Utility Functions', () => {
  describe('waitFor', () => {
    test('resolves after specified time', async () => {
      const start = Date.now();
      await waitFor(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('String utilities', () => {
    test('truncates long strings', () => {
      const truncate = (str: string, maxLength: number) => {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
      };

      expect(truncate('Hello World', 20)).toBe('Hello World');
      expect(truncate('This is a very long string', 10)).toBe('This is...');
    });

    test('capitalizes first letter', () => {
      const capitalize = (str: string) => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('WORLD')).toBe('WORLD');
      expect(capitalize('')).toBe('');
    });
  });

  describe('Array utilities', () => {
    test('chunks array into smaller arrays', () => {
      const chunk = <T>(arr: T[], size: number): T[][] => {
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          result.push(arr.slice(i, i + size));
        }
        return result;
      };

      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
      expect(chunk([], 2)).toEqual([]);
    });

    test('removes duplicates from array', () => {
      const unique = <T>(arr: T[]): T[] => {
        return Array.from(new Set(arr));
      };

      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Number utilities', () => {
    test('clamps number within range', () => {
      const clamp = (num: number, min: number, max: number) => {
        return Math.min(Math.max(num, min), max);
      };

      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    test('formats number with commas', () => {
      const formatNumber = (num: number) => {
        return num.toLocaleString('en-US');
      };

      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });
  });
});
