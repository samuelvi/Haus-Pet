import { Breed } from "./breed";

export interface BreedWriteRepository {
  save(breed: Breed): Promise<Breed>;
  update(id: string, breed: Partial<Breed>): Promise<Breed>;
  delete(id: string): Promise<void>;
}
