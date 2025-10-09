import { Pet, PetType } from "./pet";

export interface PetReadRepository {
  findAll(): Promise<Pet[]>;
  findByBreed(breed: string): Promise<Pet | null>;
  findByType(type: PetType): Promise<Pet[]>;
}
