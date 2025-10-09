import { PetReadRepository } from "../../domain/pet-read.repository";
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

  public async findAll(): Promise<Pet[]> {
    return this.pets;
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
}
