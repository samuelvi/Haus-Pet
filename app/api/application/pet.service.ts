import { PetReadRepository, PetFilters } from "../domain/pet-read.repository";
import { PetWriteRepository } from "../domain/pet-write.repository";
import { Pet, PetType } from "../domain/pet";
import { PetBreedAlreadyExistsError } from "../domain/errors/pet-breed-already-exists.error";
import { FuzzySearchService } from "./fuzzy-search.service";
import { generateId } from "../infrastructure/utils/uuid";

export class PetService {
  private fuzzySearchService: FuzzySearchService;

  constructor(
    private readonly petReadRepository: PetReadRepository,
    private readonly petWriteRepository: PetWriteRepository
  ) {
    this.fuzzySearchService = new FuzzySearchService();
  }

  public async getAllPets(filters?: PetFilters): Promise<Pet[]> {
    // Separate fuzzy search from database filters
    const dbFilters: PetFilters = {};
    if (filters?.type) {
      dbFilters.type = filters.type;
    }

    // Get pets from database (filtered by type if specified)
    let pets = await this.petReadRepository.findAll(dbFilters);

    // Apply fuzzy search at application level if search term provided
    if (filters?.search) {
      pets = this.fuzzySearchService.searchPets(pets, filters.search);
    }

    return pets;
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

  public async getRandomPetByType(type: PetType): Promise<Pet | null> {
    const pets = await this.petReadRepository.findByType(type);
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

    const newPet: Pet = {
      id: generateId(),
      breed,
      type
    };

    const savedPet = await this.petWriteRepository.save(newPet);
    return savedPet;
  }

  public async getPetById(id: string): Promise<Pet | null> {
    return this.petReadRepository.findById(id);
  }

  public async updatePet(id: string, breed: string, type: PetType): Promise<Pet> {
    const existingPet = await this.petReadRepository.findById(id);
    if (!existingPet) {
      throw new Error("Pet not found");
    }

    // Check if breed is being changed to one that already exists
    if (breed !== existingPet.breed) {
      const petWithSameBreed = await this.petReadRepository.findByBreed(breed);
      if (petWithSameBreed && petWithSameBreed.id !== id) {
        throw new PetBreedAlreadyExistsError("Pet breed already exists");
      }
    }

    return this.petWriteRepository.update(id, { breed, type });
  }

  public async deletePet(id: string): Promise<void> {
    const existingPet = await this.petReadRepository.findById(id);
    if (!existingPet) {
      throw new Error("Pet not found");
    }

    await this.petWriteRepository.delete(id);
  }
}
