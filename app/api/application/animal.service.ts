import { PrismaClient, Animal, PetType } from '@prisma/client';
import { AnimalAggregate } from '../domain/animal';
import { EventStoreRepository } from '../domain/eventsourcing';
import { AnimalProjector } from '../infrastructure/projections';
import { PhotoService } from '../infrastructure/services';

export interface CreateAnimalDto {
  name: string;
  type: 'cat' | 'dog' | 'bird';
  breed: string;
  photoUrl?: string; // Optional - will fetch random if not provided
}

export interface UpdateAnimalDto {
  name?: string;
  type?: 'cat' | 'dog' | 'bird';
  breed?: string;
  photoUrl?: string;
}

/**
 * Application service for Animal operations
 */
export class AnimalService {
  private readonly animalProjector: AnimalProjector;
  private readonly photoService: PhotoService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventStore: EventStoreRepository
  ) {
    this.animalProjector = new AnimalProjector(prisma);
    this.photoService = new PhotoService();
  }

  /**
   * Creates a new animal
   */
  async create(dto: CreateAnimalDto): Promise<Animal> {
    const id = crypto.randomUUID();

    // Fetch random photo if not provided
    const photoUrl = dto.photoUrl || (await this.photoService.getRandomPhoto(dto.type));

    // Create aggregate and raise event
    const animal = AnimalAggregate.create(id, dto.name, dto.type, dto.breed, photoUrl);

    // Persist events
    const events = animal.getUncommittedEvents();
    await this.eventStore.append(events);

    // Project to read model
    for (const event of events) {
      await this.animalProjector.project(event);
    }

    // Return the created animal from read model
    return this.prisma.animal.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Updates an existing animal
   */
  async update(id: string, dto: UpdateAnimalDto): Promise<Animal> {
    // Load aggregate from history
    const events = await this.eventStore.getEventsForAggregate(id);
    if (events.length === 0) {
      throw new Error(`Animal with id ${id} not found`);
    }

    const animal = new AnimalAggregate(id);
    animal.loadFromHistory(events);

    // Apply update
    animal.update(dto);

    // Persist new events
    const newEvents = animal.getUncommittedEvents();
    await this.eventStore.append(newEvents);

    // Project to read model
    for (const event of newEvents) {
      await this.animalProjector.project(event);
    }

    return this.prisma.animal.findUniqueOrThrow({ where: { id } });
  }

  /**
   * Deletes an animal
   */
  async delete(id: string): Promise<void> {
    // Load aggregate from history
    const events = await this.eventStore.getEventsForAggregate(id);
    if (events.length === 0) {
      throw new Error(`Animal with id ${id} not found`);
    }

    const animal = new AnimalAggregate(id);
    animal.loadFromHistory(events);

    // Mark as deleted
    animal.delete();

    // Persist new events
    const newEvents = animal.getUncommittedEvents();
    await this.eventStore.append(newEvents);

    // Project to read model
    for (const event of newEvents) {
      await this.animalProjector.project(event);
    }
  }

  /**
   * Gets all animals (from read model)
   */
  async findAll(): Promise<Animal[]> {
    return this.prisma.animal.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets animals by type (from read model)
   */
  async findByType(type: PetType): Promise<Animal[]> {
    return this.prisma.animal.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets a single animal by ID (from read model)
   */
  async findById(id: string): Promise<Animal | null> {
    return this.prisma.animal.findUnique({ where: { id } });
  }

  /**
   * Gets aggregate by ID (useful for domain operations)
   */
  async getAggregate(id: string): Promise<AnimalAggregate | null> {
    const events = await this.eventStore.getEventsForAggregate(id);
    if (events.length === 0) return null;

    const animal = new AnimalAggregate(id);
    animal.loadFromHistory(events);
    return animal;
  }
}
