import { textUtils, numberUtils, arrayUtils, dateUtils, debounce, generateId } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('textUtils', () => {
    it('should capitalize strings', () => {
      expect(textUtils.capitalize('hello')).toBe('Hello');
      expect(textUtils.capitalize('WORLD')).toBe('World');
    });

    it('should truncate long strings', () => {
      expect(textUtils.truncate('Hello World', 8)).toBe('Hello...');
      expect(textUtils.truncate('Short', 10)).toBe('Short');
    });

    it('should validate email addresses', () => {
      expect(textUtils.isValidEmail('test@example.com')).toBe(true);
      expect(textUtils.isValidEmail('invalid-email')).toBe(false);
      expect(textUtils.isValidEmail('no@domain')).toBe(false);
    });
  });

  describe('numberUtils', () => {
    it('should format numbers with commas', () => {
      expect(numberUtils.formatNumber(1000)).toBe('1,000');
      expect(numberUtils.formatNumber(1234567)).toBe('1,234,567');
    });

    it('should clamp values within range', () => {
      expect(numberUtils.clamp(5, 0, 10)).toBe(5);
      expect(numberUtils.clamp(-5, 0, 10)).toBe(0);
      expect(numberUtils.clamp(15, 0, 10)).toBe(10);
    });

    it('should format percentages', () => {
      expect(numberUtils.formatPercentage(0.5)).toBe('50.0%');
      expect(numberUtils.formatPercentage(0.333, 2)).toBe('33.30%');
    });
  });

  describe('arrayUtils', () => {
    it('should shuffle arrays', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = arrayUtils.shuffle(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled).toEqual(expect.arrayContaining(original));
    });

    it('should chunk arrays', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      const chunked = arrayUtils.chunk(array, 3);
      
      expect(chunked).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('should return unique values', () => {
      expect(arrayUtils.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(arrayUtils.unique(['a', 'b', 'a'])).toEqual(['a', 'b']);
    });

    it('should sample from array', () => {
      const array = [1, 2, 3, 4, 5];
      const sample = arrayUtils.sample(array);
      
      expect(array).toContain(sample);
    });
  });

  describe('dateUtils', () => {
    it('should check if date is today', () => {
      const today = new Date();
      expect(dateUtils.isToday(today)).toBe(true);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(dateUtils.isToday(yesterday)).toBe(false);
    });

    it('should calculate days between dates', () => {
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-11');
      
      expect(dateUtils.daysBetween(date1, date2)).toBe(10);
    });

    it('should add days to date', () => {
      const date = new Date('2024-01-01');
      const newDate = dateUtils.addDays(date, 5);
      
      expect(newDate.getDate()).toBe(6);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });
  });
});
