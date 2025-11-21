/**
 * Service for fetching random pet photos from public APIs
 */
export class PhotoService {
  // TheCatAPI (free, no API key required for basic usage)
  private static readonly CAT_API_URL = 'https://api.thecatapi.com/v1/images/search';
  // Dog CEO API (completely free)
  private static readonly DOG_API_URL = 'https://dog.ceo/api/breeds/image/random';
  // Placeholder for birds (no free bird API, using placeholder)
  private static readonly BIRD_PLACEHOLDER = 'https://placehold.co/400x400/green/white?text=Bird';

  /**
   * Fetches a random photo URL for the given pet type
   */
  async getRandomPhoto(type: 'cat' | 'dog' | 'bird'): Promise<string> {
    try {
      switch (type) {
        case 'cat':
          return await this.getCatPhoto();
        case 'dog':
          return await this.getDogPhoto();
        case 'bird':
          return this.getBirdPhoto();
        default:
          return this.getPlaceholder(type);
      }
    } catch (error) {
      console.error(`Failed to fetch ${type} photo:`, error);
      return this.getPlaceholder(type);
    }
  }

  private async getCatPhoto(): Promise<string> {
    const response = await fetch(PhotoService.CAT_API_URL);
    if (!response.ok) {
      throw new Error(`Cat API returned ${response.status}`);
    }
    const data = (await response.json()) as Array<{ url: string }>;
    return data[0]?.url || this.getPlaceholder('cat');
  }

  private async getDogPhoto(): Promise<string> {
    const response = await fetch(PhotoService.DOG_API_URL);
    if (!response.ok) {
      throw new Error(`Dog API returned ${response.status}`);
    }
    const data = (await response.json()) as { message: string; status: string };
    return data.message || this.getPlaceholder('dog');
  }

  private getBirdPhoto(): string {
    // Use a curated list of free bird images from Unsplash
    const birdImages = [
      'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1480044965905-02098d419e96?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1549608276-5786777e6587?w=400&h=400&fit=crop',
    ];
    return birdImages[Math.floor(Math.random() * birdImages.length)];
  }

  private getPlaceholder(type: string): string {
    const colors: Record<string, string> = {
      cat: 'orange',
      dog: 'brown',
      bird: 'green',
    };
    const color = colors[type] || 'gray';
    return `https://placehold.co/400x400/${color}/white?text=${type.charAt(0).toUpperCase() + type.slice(1)}`;
  }
}
