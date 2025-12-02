import { BreedTypeRepository } from "../domain/breed-type.repository";
import { BreedType } from "../domain/breed";
import { generateId } from "../infrastructure/utils/uuid";
import { EventBus } from "../infrastructure/events/EventBus";
import { BreedTypeCreatedEvent, BreedTypeDeletedEvent } from "../domain/events/DomainEvent";
import { PaginatedResponse, normalizePaginationParams, calculatePaginationMeta } from "../domain/pagination";

export class BreedTypeService {
  constructor(
    private readonly breedTypeRepository: BreedTypeRepository,
    private readonly eventBus: EventBus
  ) {}

  async list(page: number = 1, limit?: number): Promise<PaginatedResponse<BreedType>> {
    // Use ADMIN_PAGE_SIZE as default if limit not provided
    const adminPageSize = parseInt(process.env.ADMIN_PAGE_SIZE || '10', 10);
    const { page: normalizedPage, limit: normalizedLimit } = normalizePaginationParams({ page, limit: limit || adminPageSize });

    // Fetch N+1 to detect if there are more pages
    const types = await this.breedTypeRepository.findAll(normalizedPage, normalizedLimit + 1);

    // Calculate pagination metadata
    return calculatePaginationMeta(types, normalizedPage, normalizedLimit);
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
