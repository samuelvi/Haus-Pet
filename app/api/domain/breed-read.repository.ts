import { Breed, PetType } from "./breed";

export interface BreedFilters {
  type?: PetType;
  search?: string; // Fuzzy search on breed name
}

export interface BreedReadRepository {
  findAll(filters?: BreedFilters): Promise<Breed[]>;
  findById(id: string): Promise<Breed | null>;
  findByName(name: string): Promise<Breed | null>;
  findByType(type: PetType): Promise<Breed[]>;
}
