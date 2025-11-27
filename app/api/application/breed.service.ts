import { BreedReadRepository, BreedFilters } from "../domain/breed-read.repository";
import { BreedWriteRepository } from "../domain/breed-write.repository";
import { Breed, PetType } from "../domain/breed";
import { BreedAlreadyExistsError } from "../domain/errors/breed-already-exists.error";
import { FuzzySearchService } from "./fuzzy-search.service";
import { generateId } from "../infrastructure/utils/uuid";
import { BreedTypeRepository } from "../domain/breed-type.repository";

export class BreedService {
  private fuzzySearchService: FuzzySearchService;

  constructor(
    private readonly breedReadRepository: BreedReadRepository,
    private readonly breedWriteRepository: BreedWriteRepository,
    private readonly breedTypeRepository: BreedTypeRepository
  ) {
    this.fuzzySearchService = new FuzzySearchService();
  }

  public async getAllBreeds(filters?: BreedFilters): Promise<Breed[]> {
    // Separate fuzzy search from database filters
    const dbFilters: BreedFilters = {};
    if (filters?.type) {
      dbFilters.type = filters.type;
    }

    // Get breeds from database (filtered by type if specified)
    let breeds = await this.breedReadRepository.findAll(dbFilters);

    // Apply fuzzy search at application level if search term provided
    if (filters?.search) {
      breeds = this.fuzzySearchService.searchBreeds(breeds, filters.search);
    }

    return breeds;
  }

  public async getBreedsByType(type: PetType): Promise<Breed[]> {
    return this.breedReadRepository.findByType(type);
  }

  public async getRandomBreed(): Promise<Breed | null> {
    const breeds = await this.breedReadRepository.findAll();
    if (breeds.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * breeds.length);
    return breeds[randomIndex];
  }

  public async getRandomBreedByType(type: PetType): Promise<Breed | null> {
    const breeds = await this.breedReadRepository.findByType(type);
    if (breeds.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * breeds.length);
    return breeds[randomIndex];
  }

  public async addBreed(name: string, petType: PetType): Promise<Breed> {
    const existingBreed = await this.breedReadRepository.findByName(name);
    if (existingBreed) {
      throw new BreedAlreadyExistsError("Breed already exists");
    }

    const breedType = await this.breedTypeRepository.findByName(petType);
    if (!breedType?.id) {
      throw new Error(`Breed type '${petType}' does not exist`);
    }

    const newBreed: Breed = {
      id: generateId(),
      name,
      petType,
      breedTypeId: breedType.id,
    };

    const savedBreed = await this.breedWriteRepository.save(newBreed);
    return savedBreed;
  }

  public async getBreedById(id: string): Promise<Breed | null> {
    return this.breedReadRepository.findById(id);
  }

  public async updateBreed(id: string, name: string, petType: PetType): Promise<Breed> {
    const existingBreed = await this.breedReadRepository.findById(id);
    if (!existingBreed) {
      throw new Error("Breed not found");
    }

    // Check if name is being changed to one that already exists
    if (name !== existingBreed.name) {
      const breedWithSameName = await this.breedReadRepository.findByName(name);
      if (breedWithSameName && breedWithSameName.id !== id) {
        throw new BreedAlreadyExistsError("Breed already exists");
      }
    }

    const breedType = await this.breedTypeRepository.findByName(petType);
    if (!breedType?.id) {
      throw new Error(`Breed type '${petType}' does not exist`);
    }

    return this.breedWriteRepository.update(id, { name, petType, breedTypeId: breedType.id });
  }

  public async deleteBreed(id: string): Promise<void> {
    const existingBreed = await this.breedReadRepository.findById(id);
    if (!existingBreed) {
      throw new Error("Breed not found");
    }

    const petsUsing = await this.breedReadRepository.countPetsUsingBreedName(existingBreed.name);
    if (petsUsing > 0) {
      throw new Error("Cannot delete breed: there are pets using this breed");
    }

    await this.breedWriteRepository.delete(id);
  }
}
