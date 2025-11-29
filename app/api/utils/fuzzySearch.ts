/**
 * Calculates the Levenshtein distance between two strings.
 * This represents the minimum number of single-character edits required
 * to transform one string into another.
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = Array.from({ length: b.length + 1 }, () => []);

  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i;
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Calculates a fuzzy match score between a source string and a query.
 * Returns a value between 0 (no match) and 1 (perfect match).
 *
 * @param source - The string to match against
 * @param query - The search query
 * @returns A score from 0 to 1, where 1 is an exact or substring match
 */
export const fuzzyScore = (source: string, query: string): number => {
  const a = source.toLowerCase();
  const b = query.toLowerCase();

  if (!a || !b) return 0;
  if (a === b) return 1; // perfect match
  if (a.includes(b)) return 0.95; // substring match gets high score

  const distance = levenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  const similarity = 1 - distance / maxLen;

  return Math.max(0, similarity);
};

/**
 * Finds similar items based on fuzzy matching.
 *
 * @param items - Array of items to search
 * @param query - Search query string
 * @param getSearchableField - Function that returns the string to search for each item
 * @param threshold - Minimum score to include in results (default: 0.6)
 * @returns Array of items with scores, sorted by score (highest first)
 */
export const findSimilar = <T>(
  items: T[],
  query: string,
  getSearchableField: (item: T) => string,
  threshold: number = 0.6
): Array<{ item: T; score: number }> => {
  const lowerQuery = query.trim().toLowerCase();

  if (!lowerQuery) {
    return [];
  }

  return items
    .map(item => {
      const field = getSearchableField(item);
      const score = fuzzyScore(field, lowerQuery);
      return { item, score };
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score);
};
