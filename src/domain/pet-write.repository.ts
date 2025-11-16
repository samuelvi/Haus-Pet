import { Pet } from "./pet";

export interface PetWriteRepository {
  save(pet: Pet): Promise<Pet>;
  update(id: number, pet: Partial<Pet>): Promise<Pet>;
  delete(id: number): Promise<void>;
}
