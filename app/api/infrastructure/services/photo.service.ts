import * as fs from 'fs';
import * as path from 'path';

/**
 * Service for selecting random local pet photos
 * Uses the local image collection with fallback to download from external APIs
 */
export class PhotoService {
  // Local image paths (served by Express static middleware)
  private static readonly LOCAL_IMAGES = {
    cat: ['/img/cat1.png', '/img/cat2.png', '/img/cat3.png', '/img/cat4.png'],
    dog: ['/img/dog1.png', '/img/dog2.png', '/img/dog3.png', '/img/dog4.png'],
    bird: ['/img/bird1.jpeg', '/img/bird2.png', '/img/bird3.png', '/img/bird4.jpeg'],
  };

  // External APIs for fallback
  private static readonly CAT_API_URL = 'https://api.thecatapi.com/v1/images/search';
  private static readonly DOG_API_URL = 'https://dog.ceo/api/breeds/image/random';
  private static readonly BIRD_IMAGES = [
    'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1480044965905-02098d419e96?w=400&h=400&fit=crop',
  ];

  // Path where images are stored
  private static readonly IMAGES_DIR = process.env.NODE_ENV === 'development'
    ? '/app/frontend-images'
    : path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'img');

  /**
   * Returns a random local photo URL for the given pet type
   * If no local images exist, downloads one from external API and saves it
   */
  async getRandomPhoto(type: string): Promise<string> {
    try {
      // First, try to use local images
      return this.getLocalPhoto(type);
    } catch (error) {
      console.warn(`No local images for ${type}, attempting to download from API...`);

      // Fallback: download from external API and save locally
      try {
        return await this.downloadAndSavePhoto(type);
      } catch (downloadError) {
        console.error(`Failed to download photo for ${type}:`, downloadError);
        // Last resort: return a simple placeholder path
        return '/img/placeholder.png';
      }
    }
  }

  /**
   * Selects a random local image for the given type
   */
  private getLocalPhoto(type: string): string {
    const images = PhotoService.LOCAL_IMAGES[type as keyof typeof PhotoService.LOCAL_IMAGES];

    if (!images || images.length === 0) {
      throw new Error(`No local images available for type: ${type}`);
    }

    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }

  /**
   * Downloads a photo from external API and saves it locally
   * Returns the local path to the saved image
   */
  private async downloadAndSavePhoto(type: string): Promise<string> {
    let imageUrl: string;
    let extension: string;

    // Get image URL from external API based on type
    switch (type) {
      case 'cat':
        imageUrl = await this.fetchCatImageUrl();
        extension = '.jpg';
        break;
      case 'dog':
        imageUrl = await this.fetchDogImageUrl();
        extension = '.jpg';
        break;
      case 'bird':
        imageUrl = this.getBirdImageUrl();
        extension = '.jpg';
        break;
      default:
        throw new Error(`Unsupported pet type: ${type}`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${type}_${timestamp}${extension}`;
    const localPath = `/img/${filename}`;
    const fullPath = path.join(PhotoService.IMAGES_DIR, filename);

    // Download and save the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure directory exists
    if (!fs.existsSync(PhotoService.IMAGES_DIR)) {
      fs.mkdirSync(PhotoService.IMAGES_DIR, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, buffer);
    console.log(`✅ Downloaded and saved image: ${localPath}`);

    return localPath;
  }

  private async fetchCatImageUrl(): Promise<string> {
    const response = await fetch(PhotoService.CAT_API_URL);
    if (!response.ok) {
      throw new Error(`Cat API returned ${response.status}`);
    }
    const data = (await response.json()) as Array<{ url: string }>;
    return data[0]?.url;
  }

  private async fetchDogImageUrl(): Promise<string> {
    const response = await fetch(PhotoService.DOG_API_URL);
    if (!response.ok) {
      throw new Error(`Dog API returned ${response.status}`);
    }
    const data = (await response.json()) as { message: string; status: string };
    return data.message;
  }

  private getBirdImageUrl(): string {
    const randomIndex = Math.floor(Math.random() * PhotoService.BIRD_IMAGES.length);
    return PhotoService.BIRD_IMAGES[randomIndex];
  }
}
