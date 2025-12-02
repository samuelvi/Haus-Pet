import { BreedType } from "./breed";

export interface BreedTypeRepository {
  findAll(page?: number, limit?: number): Promise<BreedType[]>;
  findById(id: string): Promise<BreedType | null>;
  findByName(name: string): Promise<BreedType | null>;
  create(breedType: BreedType): Promise<BreedType>;
  update(id: string, data: Partial<BreedType>): Promise<BreedType>;
  delete(id: string): Promise<void>;
  countBreedsByTypeId(id: string): Promise<number>;
}
