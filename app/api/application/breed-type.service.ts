import { BreedTypeRepository } from "../domain/breed-type.repository";
import { BreedType } from "../domain/breed";
import { generateId } from "../infrastructure/utils/uuid";

export class BreedTypeService {
  constructor(private readonly breedTypeRepository: BreedTypeRepository) {}

  async list(): Promise<BreedType[]> {
    return this.breedTypeRepository.findAll();
  }

  async create(name: string): Promise<BreedType> {
    const existing = await this.breedTypeRepository.findByName(name);
    if (existing) {
      return existing;
    }
    const breedType: BreedType = {
      id: generateId(),
      name,
    };
    return this.breedTypeRepository.create(breedType);
  }

  async update(id: string, name: string): Promise<BreedType> {
    const existing = await this.breedTypeRepository.findById(id);
    if (!existing) {
      throw new Error("Breed type not found");
    }
    return this.breedTypeRepository.update(id, { name });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.breedTypeRepository.findById(id);
    if (!existing) {
      throw new Error("Breed type not found");
    }
    const inUse = await this.breedTypeRepository.countBreedsByTypeId(id);
    if (inUse > 0) {
      throw new Error("Cannot delete breed type with associated breeds");
    }
    await this.breedTypeRepository.delete(id);
  }
}
