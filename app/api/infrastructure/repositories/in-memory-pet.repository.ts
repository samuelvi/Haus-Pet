import { PetReadRepository, PetFilters } from "../../domain/pet-read.repository";
import { PetWriteRepository } from "../../domain/pet-write.repository";
import { Pet, PetType } from "../../domain/pet";

export class InMemoryPetRepository implements PetReadRepository, PetWriteRepository {
  private pets: Pet[] = [
    { id: 1, breed: "Siamese", type: PetType.Cat },
    { id: 2, breed: "Persian", type: PetType.Cat },
    { id: 3, breed: "Golden Retriever", type: PetType.Dog },
    { id: 4, breed: "Labrador", type: PetType.Dog },
    { id: 5, breed: "Budgerigar", type: PetType.Bird },
  ];
  private nextId = 6;

  public async findAll(filters?: PetFilters): Promise<Pet[]> {
    let result = [...this.pets];

    // Only filter by type at repository level
    // Search/fuzzy matching is done at application level for consistency
    if (filters?.type) {
      result = result.filter((pet) => pet.type === filters.type);
    }

    return result.sort((a, b) => a.breed.localeCompare(b.breed));
  }

  public async findById(id: number): Promise<Pet | null> {
    const foundPet = this.pets.find((pet) => pet.id === id);
    return foundPet || null;
  }

  public async findByBreed(breed: string): Promise<Pet | null> {
    const foundPet = this.pets.find((pet) => pet.breed.toLowerCase() === breed.toLowerCase());
    return foundPet || null;
  }

  public async findByType(type: PetType): Promise<Pet[]> {
    return this.pets.filter((pet) => pet.type === type);
  }

  public async save(pet: Pet): Promise<Pet> {
    const newPetWithId = { ...pet, id: this.nextId++ };
    this.pets.push(newPetWithId);
    return newPetWithId;
  }

  public async update(id: number, petData: Partial<Pet>): Promise<Pet> {
    const index = this.pets.findIndex((pet) => pet.id === id);
    if (index === -1) {
      throw new Error("Pet not found");
    }

    this.pets[index] = { ...this.pets[index], ...petData };
    return this.pets[index];
  }

  public async delete(id: number): Promise<void> {
    const index = this.pets.findIndex((pet) => pet.id === id);
    if (index === -1) {
      throw new Error("Pet not found");
    }

    this.pets.splice(index, 1);
  }
}
