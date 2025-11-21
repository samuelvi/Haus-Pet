import { Pet } from "./pet";

export interface PetWriteRepository {
  save(pet: Pet): Promise<Pet>;
  update(id: string, pet: Partial<Pet>): Promise<Pet>;
  delete(id: string): Promise<void>;
}
