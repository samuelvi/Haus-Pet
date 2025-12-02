import { PrismaClient, Pet, Prisma } from '@prisma/client';
import { PetAggregate } from '../domain/pet';
import { EventStoreRepository } from '../domain/eventsourcing';
import { PetProjector } from '../infrastructure/projections';
import { PhotoService } from '../infrastructure/services';
import { generateId } from '../infrastructure/utils/uuid';
import type { PetType } from '../domain/breed';
import { PaginatedResponse, normalizePaginationParams, calculatePaginationMeta } from '../domain/pagination';

export interface CreatePetDto {
  name: string;
  type: PetType;
  breed: string;
  photoUrl?: string; // Optional - will fetch random if not provided
}

export interface UpdatePetDto {
  name?: string;
  type?: PetType;
  breed?: string;
  photoUrl?: string;
}

/**
 * Application service for Pet operations
 */
export class PetService {
  private readonly petProjector: PetProjector;
  private readonly photoService: PhotoService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventStore: EventStoreRepository
  ) {
    this.petProjector = new PetProjector(prisma);
    this.photoService = new PhotoService();
  }

  /**
   * Creates a new pet
   */
  async create(dto: CreatePetDto): Promise<Pet> {
    const id = generateId();

    // Fetch random photo if not provided
    const photoUrl = dto.photoUrl || (await this.photoService.getRandomPhoto(dto.type as any));

    // Create aggregate and raise event
    const pet = PetAggregate.create(id, dto.name, dto.type, dto.breed, photoUrl);

    // Persist events
    const events = pet.getUncommittedEvents();
    await this.eventStore.append(events);

    // Project to read model
    for (const event of events) {
      await this.petProjector.project(event);
    }

    // Return the created pet from read model
    return this.prisma.pet.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Updates an existing pet
   */
  async update(id: string, dto: UpdatePetDto): Promise<Pet> {
    // Load aggregate from history
    const events = await this.eventStore.getEventsForAggregate(id);
    if (events.length === 0) {
      throw new Error(`Pet with id ${id} not found`);
    }

    const pet = new PetAggregate(id);
    pet.loadFromHistory(events);

    // Apply update
    pet.update(dto);

    // Persist new events
    const newEvents = pet.getUncommittedEvents();
    await this.eventStore.append(newEvents);

    // Project to read model
    for (const event of newEvents) {
      await this.petProjector.project(event);
    }

    return this.prisma.pet.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Deletes a pet
   */
  async delete(id: string): Promise<void> {
    // Load aggregate from history
    const sponsorshipCount = await this.prisma.sponsorship.count({ where: { petId: id } });
    if (sponsorshipCount > 0) {
      throw new Error("Cannot delete pet with existing sponsorships");
    }

    const events = await this.eventStore.getEventsForAggregate(id);
    if (events.length === 0) {
      throw new Error(`Pet with id ${id} not found`);
    }

    const pet = new PetAggregate(id);
    pet.loadFromHistory(events);

    // Mark as deleted
    pet.delete();

    // Persist new events
    const newEvents = pet.getUncommittedEvents();
    await this.eventStore.append(newEvents);

    // Project to read model
    for (const event of newEvents) {
      await this.petProjector.project(event);
    }
  }

  /**
   * Gets all pets (from read model)
   * Returns pets in random order for gallery display
   */
  async findAll(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Pet>> {
    const { page: normalizedPage, limit: normalizedLimit } = normalizePaginationParams({ page, limit });
    const offset = (normalizedPage - 1) * normalizedLimit;

    // Fetch N+1 to detect if there are more pages
    // Use raw SQL for random ordering (PostgreSQL RANDOM())
    const rawPets = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "readmodels"."pets"
      ORDER BY RANDOM()
      LIMIT ${normalizedLimit + 1}
      OFFSET ${offset}
    `;

    // Map snake_case to camelCase and convert types
    const pets = rawPets.map(pet => ({
      id: pet.id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      photoUrl: pet.photo_url,
      totalSponsored: new Prisma.Decimal(pet.total_sponsored || 0),
      createdAt: pet.created_at,
      updatedAt: pet.updated_at,
    }));

    // Calculate pagination metadata
    return calculatePaginationMeta(pets, normalizedPage, normalizedLimit);
  }

  /**
   * Gets pets by type (from read model)
   * Returns pets in random order for gallery display
   */
  async findByType(type: PetType, page: number = 1, limit: number = 20): Promise<PaginatedResponse<Pet>> {
    const { page: normalizedPage, limit: normalizedLimit } = normalizePaginationParams({ page, limit });
    const offset = (normalizedPage - 1) * normalizedLimit;

    // Fetch N+1 to detect if there are more pages
    // Use raw SQL for random ordering (PostgreSQL RANDOM())
    const rawPets = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "readmodels"."pets"
      WHERE type = ${type}
      ORDER BY RANDOM()
      LIMIT ${normalizedLimit + 1}
      OFFSET ${offset}
    `;

    // Map snake_case to camelCase and convert types
    const pets = rawPets.map(pet => ({
      id: pet.id,
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      photoUrl: pet.photo_url,
      totalSponsored: new Prisma.Decimal(pet.total_sponsored || 0),
      createdAt: pet.created_at,
      updatedAt: pet.updated_at,
    }));

    // Calculate pagination metadata
    return calculatePaginationMeta(pets, normalizedPage, normalizedLimit);
  }

  /**
   * Gets a single pet by ID (from read model)
   */
  async findById(id: string): Promise<Pet | null> {
    return this.prisma.pet.findUnique({ where: { id } });
  }

  /**
   * Searches pets by name (case-insensitive partial match from read model)
   */
  async findByName(name: string): Promise<Pet[]> {
    return this.prisma.pet.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets aggregate by ID (useful for domain operations)
   */
  async getAggregate(id: string): Promise<PetAggregate | null> {
    const events = await this.eventStore.getEventsForAggregate(id);
    if (events.length === 0) return null;

    const pet = new PetAggregate(id);
    pet.loadFromHistory(events);
    return pet;
  }
}
