import { rankLanguages } from '../logic/filter';
import { LANGUAGES } from '../data/languages';

describe('rankLanguages', () => {
  test('returns top languages first when query is empty', () => {
    const result = rankLanguages('');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].code).toMatch(/^(en|en-GB|en-US|es|fr|de|it|pt|pa|hi|zh|ja|ko)$/);
  });

  test('exact ISO code match ranks highest', () => {
    const result = rankLanguages('pa');
    expect(result[0].code).toBe('pa');
    expect(result[0].name).toBe('Punjabi');
  });

  test('matches accent-insensitively', () => {
    const result = rankLanguages('espanol');
    const spanish = result.find((l) => l.code === 'es');
    expect(spanish).toBeDefined();
    expect(spanish?.name).toBe('Spanish');
  });

  test('startsWith outranks substring', () => {
    const result = rankLanguages('en');
    const topResults = result.slice(0, 5);
    const codes = topResults.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('en-GB');
    expect(codes).toContain('en-US');
  });

  test('matches on name, endonym, and aliases', () => {
    const result = rankLanguages('british');
    const british = result.find((l) => l.code === 'en-GB');
    expect(british).toBeDefined();
  });

  test('multiple tokens work correctly', () => {
    const result = rankLanguages('british en');
    const british = result.find((l) => l.code === 'en-GB');
    expect(british).toBeDefined();
  });

  test('returns empty array when no matches', () => {
    const result = rankLanguages('xyzabc123');
    expect(result).toEqual([]);
  });

  test('handles special characters gracefully', () => {
    const result = rankLanguages('français');
    const french = result.find((l) => l.code === 'fr');
    expect(french).toBeDefined();
  });

  test('case insensitive search', () => {
    const result = rankLanguages('PUNJABI');
    const punjabi = result.find((l) => l.code === 'pa');
    expect(punjabi).toBeDefined();
  });

  test('returns all languages when query is empty', () => {
    const result = rankLanguages('');
    expect(result.length).toBe(LANGUAGES.length);
  });
});
