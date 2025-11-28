import { BreedTypeRepository } from "../domain/breed-type.repository";
import { BreedType } from "../domain/breed";
import { generateId } from "../infrastructure/utils/uuid";
import { EventBus } from "../infrastructure/events/EventBus";
import { BreedTypeCreatedEvent, BreedTypeDeletedEvent } from "../domain/events/DomainEvent";

export class BreedTypeService {
  constructor(
    private readonly breedTypeRepository: BreedTypeRepository,
    private readonly eventBus: EventBus
  ) {}

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
    const created = await this.breedTypeRepository.create(breedType);

    // Emit domain event
    await this.eventBus.publish(
      new BreedTypeCreatedEvent({
        breedTypeId: created.id!, // We know this exists after creation
        name: created.name,
      })
    );

    return created;
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

    // Emit domain event
    await this.eventBus.publish(
      new BreedTypeDeletedEvent({
        breedTypeId: id,
      })
    );
  }
}
