import { PrismaClient, Pet } from '@prisma/client';
import { PetAggregate } from '../domain/pet';
import { EventStoreRepository } from '../domain/eventsourcing';
import { PetProjector } from '../infrastructure/projections';
import { PhotoService } from '../infrastructure/services';
import { generateId } from '../infrastructure/utils/uuid';
import type { PetType } from '../domain/breed';

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
   */
  async findAll(): Promise<Pet[]> {
    return this.prisma.pet.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets pets by type (from read model)
   */
  async findByType(type: PetType): Promise<Pet[]> {
    return this.prisma.pet.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
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
