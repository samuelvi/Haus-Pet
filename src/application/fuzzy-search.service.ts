import Fuse from 'fuse.js';
import { Pet } from '../domain/pet';

/**
 * Fuzzy search service using Fuse.js
 * Works with any database - search happens at application level
 */
export class FuzzySearchService {
  /**
   * Perform fuzzy search on pets by breed
   * @param pets - Array of pets to search
   * @param searchTerm - Search term (can include typos)
   * @param threshold - Similarity threshold (0.0 = exact match, 1.0 = match anything)
   * @returns Filtered pets matching the search term
   */
  public searchPets(pets: Pet[], searchTerm: string, threshold: number = 0.4): Pet[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return pets;
    }

    const fuse = new Fuse(pets, {
      keys: ['breed'], // Search in breed field
      threshold: threshold, // 0.0 requires exact match, 1.0 matches anything
      distance: 100, // Maximum distance to search
      includeScore: true,
      ignoreLocation: true, // Don't consider position of match
    });

    const results = fuse.search(searchTerm);
    return results.map(result => result.item);
  }
}
