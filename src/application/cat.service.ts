import { CatRepository } from "../domain/cat.repository";
import { Cat } from "../domain/cat";

export class CatService {
  constructor(private readonly catRepository: CatRepository) {}

  public async getRandomCatBreed(): Promise<Cat | null> {
    const breeds = await this.catRepository.findAll();
    if (breeds.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * breeds.length);
    return breeds[randomIndex];
  }
}
