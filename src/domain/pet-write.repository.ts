import { Pet } from "./pet";

export interface PetWriteRepository {
  save(pet: Pet): Promise<Pet>;
}
