import { BreedReadRepository, BreedFilters } from "../../domain/breed-read.repository";
import { BreedWriteRepository } from "../../domain/breed-write.repository";
import { Breed, PetType } from "../../domain/breed";
import { generateId } from "../utils/uuid";

export class InMemoryBreedRepository implements BreedReadRepository, BreedWriteRepository {
  private breeds: Breed[] = [
    { id: generateId(), name: "Siamese", petType: PetType.Cat },
    { id: generateId(), name: "Persian", petType: PetType.Cat },
    { id: generateId(), name: "Golden Retriever", petType: PetType.Dog },
    { id: generateId(), name: "Labrador", petType: PetType.Dog },
    { id: generateId(), name: "Budgerigar", petType: PetType.Bird },
  ];

  public async findAll(filters?: BreedFilters): Promise<Breed[]> {
    let result = [...this.breeds];

    // Only filter by type at repository level
    // Search/fuzzy matching is done at application level for consistency
    if (filters?.type) {
      result = result.filter((breed) => breed.petType === filters.type);
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  public async findById(id: string): Promise<Breed | null> {
    const foundBreed = this.breeds.find((breed) => breed.id === id);
    return foundBreed || null;
  }

  public async findByName(name: string): Promise<Breed | null> {
    const foundBreed = this.breeds.find((breed) => breed.name.toLowerCase() === name.toLowerCase());
    return foundBreed || null;
  }

  public async findByType(type: PetType): Promise<Breed[]> {
    return this.breeds.filter((breed) => breed.petType === type);
  }

  public async save(breed: Breed): Promise<Breed> {
    const newBreedWithId = { ...breed };
    // ID should already be provided from BreedService
    if (!newBreedWithId.id) {
      newBreedWithId.id = generateId();
    }
    this.breeds.push(newBreedWithId);
    return newBreedWithId;
  }

  public async update(id: string, breedData: Partial<Breed>): Promise<Breed> {
    const index = this.breeds.findIndex((breed) => breed.id === id);
    if (index === -1) {
      throw new Error("Breed not found");
    }

    this.breeds[index] = { ...this.breeds[index], ...breedData };
    return this.breeds[index];
  }

  public async delete(id: string): Promise<void> {
    const index = this.breeds.findIndex((breed) => breed.id === id);
    if (index === -1) {
      throw new Error("Breed not found");
    }

    this.breeds.splice(index, 1);
  }
}
