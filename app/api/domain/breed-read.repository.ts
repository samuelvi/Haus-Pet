import { Breed, PetType } from "./breed";

export interface BreedFilters {
  type?: PetType;
  search?: string; // Fuzzy search on breed name
}

export interface BreedReadRepository {
  findAll(filters?: BreedFilters, page?: number, limit?: number): Promise<Breed[]>;
  findById(id: string): Promise<Breed | null>;
  findByName(name: string): Promise<Breed | null>;
  findByType(type: PetType, page?: number, limit?: number): Promise<Breed[]>;
  countPetsUsingBreedName(name: string): Promise<number>;
}
