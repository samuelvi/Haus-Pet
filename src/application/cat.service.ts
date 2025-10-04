import { CatRepository } from "../domain/cat.repository";
import { Cat } from "../domain/cat";
import { CatBreedAlreadyExistsError } from "../domain/errors/cat-breed-already-exists.error";

export class CatService {
  constructor(private readonly catRepository: CatRepository) {}

  public async getAllCatBreeds(): Promise<Cat[]> {
    return this.catRepository.findAll();
  }

  public async getRandomCatBreed(): Promise<Cat | null> {
    const breeds = await this.catRepository.findAll();
    if (breeds.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * breeds.length);
    return breeds[randomIndex];
  }

  public async addCatBreed(breed: string): Promise<Cat> {
    const existingCat = await this.catRepository.findByBreed(breed);
    if (existingCat) {
      throw new CatBreedAlreadyExistsError("Cat breed already exists");
    }

    const newCat: Cat = { breed };
    // Capturamos y devolvemos el gato completo, con su ID, tal como lo devuelve el repositorio.
    const savedCat = await this.catRepository.save(newCat);
    return savedCat;
  }
}
