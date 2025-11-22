import Fuse from 'fuse.js';
import { Breed } from '../domain/breed';

/**
 * Fuzzy search service using Fuse.js
 * Works with any database - search happens at application level
 */
export class FuzzySearchService {
  /**
   * Perform fuzzy search on breeds by name
   * @param breeds - Array of breeds to search
   * @param searchTerm - Search term (can include typos)
   * @param threshold - Similarity threshold (0.0 = exact match, 1.0 = match anything)
   * @returns Filtered breeds matching the search term
   */
  public searchBreeds(breeds: Breed[], searchTerm: string, threshold: number = 0.4): Breed[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return breeds;
    }

    const fuse = new Fuse(breeds, {
      keys: ['name'], // Search in name field
      threshold: threshold, // 0.0 requires exact match, 1.0 matches anything
      distance: 100, // Maximum distance to search
      includeScore: true,
      ignoreLocation: true, // Don't consider position of match
    });

    const results = fuse.search(searchTerm);
    return results.map(result => result.item);
  }
}
