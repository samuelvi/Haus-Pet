import { CatReadRepository } from "../domain/cat-read.repository";
import { CatWriteRepository } from "../domain/cat-write.repository";
import { Cat } from "../domain/cat";
import { CatBreedAlreadyExistsError } from "../domain/errors/cat-breed-already-exists.error";

export class CatService {
  constructor(
    private readonly catReadRepository: CatReadRepository,
    private readonly catWriteRepository: CatWriteRepository
  ) {}

  public async getAllCatBreeds(): Promise<Cat[]> {
    return this.catReadRepository.findAll();
  }

  public async getRandomCatBreed(): Promise<Cat | null> {
    const breeds = await this.catReadRepository.findAll();
    if (breeds.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * breeds.length);
    return breeds[randomIndex];
  }

  public async addCatBreed(breed: string): Promise<Cat> {
    // Use the read repository to check for existence
    const existingCat = await this.catReadRepository.findByBreed(breed);
    if (existingCat) {
      throw new CatBreedAlreadyExistsError("Cat breed already exists");
    }

    const newCat: Cat = { breed };

    // Use the write repository to save the new entity
    const savedCat = await this.catWriteRepository.save(newCat);
    return savedCat;
  }
}
