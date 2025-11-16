import { Pet, PetType } from "./pet";

export interface PetFilters {
  type?: PetType;
  search?: string; // Fuzzy search on breed name
}

export interface PetReadRepository {
  findAll(filters?: PetFilters): Promise<Pet[]>;
  findById(id: number): Promise<Pet | null>;
  findByBreed(breed: string): Promise<Pet | null>;
  findByType(type: PetType): Promise<Pet[]>;
}
