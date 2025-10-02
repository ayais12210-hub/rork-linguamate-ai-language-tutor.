export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter(Boolean);
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function calculateCER(reference: string, hypothesis: string): number {
  const refNorm = normalize(reference);
  const hypNorm = normalize(hypothesis);

  if (refNorm.length === 0) return hypNorm.length === 0 ? 0 : 1;

  const distance = levenshteinDistance(refNorm, hypNorm);
  return distance / refNorm.length;
}

export function calculateWER(reference: string, hypothesis: string): number {
  const refTokens = tokenize(reference);
  const hypTokens = tokenize(hypothesis);

  if (refTokens.length === 0) return hypTokens.length === 0 ? 0 : 1;

  const distance = levenshteinDistance(refTokens.join(' '), hypTokens.join(' '));
  return distance / refTokens.join(' ').length;
}
