import { Breed, AnimalType } from "./breed";

export interface BreedFilters {
  type?: AnimalType;
  search?: string; // Fuzzy search on breed name
}

export interface BreedReadRepository {
  findAll(filters?: BreedFilters): Promise<Breed[]>;
  findById(id: string): Promise<Breed | null>;
  findByName(name: string): Promise<Breed | null>;
  findByType(type: AnimalType): Promise<Breed[]>;
}
