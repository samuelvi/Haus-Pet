import { PetReadRepository } from "../domain/pet-read.repository";
import { PetWriteRepository } from "../domain/pet-write.repository";
import { Pet, PetType } from "../domain/pet";
import { PetBreedAlreadyExistsError } from "../domain/errors/pet-breed-already-exists.error";

export class PetService {
  constructor(
    private readonly petReadRepository: PetReadRepository,
    private readonly petWriteRepository: PetWriteRepository
  ) {}

  public async getAllPets(): Promise<Pet[]> {
    return this.petReadRepository.findAll();
  }

  public async getPetsByType(type: PetType): Promise<Pet[]> {
    return this.petReadRepository.findByType(type);
  }

  public async getRandomPet(): Promise<Pet | null> {
    const pets = await this.petReadRepository.findAll();
    if (pets.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * pets.length);
    return pets[randomIndex];
  }

  public async addPet(breed: string, type: PetType): Promise<Pet> {
    const existingPet = await this.petReadRepository.findByBreed(breed);
    if (existingPet) {
      throw new PetBreedAlreadyExistsError("Pet breed already exists");
    }

    const newPet: Pet = { breed, type };

    const savedPet = await this.petWriteRepository.save(newPet);
    return savedPet;
  }
}
