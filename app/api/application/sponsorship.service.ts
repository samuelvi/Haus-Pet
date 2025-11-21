import { PrismaClient, Sponsorship } from '@prisma/client';
import { SponsorshipAggregate } from '../domain/sponsorship';
import { AnimalAggregate } from '../domain/animal';
import { EventStoreRepository } from '../domain/eventsourcing';
import { SponsorshipProjector, AnimalProjector } from '../infrastructure/projections';
import { generateId } from '../infrastructure/utils/uuid';

export interface CreateSponsorshipDto {
  animalId: string;
  email: string;
  name: string;
  amount: number;
  currency?: string;
}

/**
 * Application service for Sponsorship operations
 */
export class SponsorshipService {
  private readonly sponsorshipProjector: SponsorshipProjector;
  private readonly animalProjector: AnimalProjector;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventStore: EventStoreRepository
  ) {
    this.sponsorshipProjector = new SponsorshipProjector(prisma);
    this.animalProjector = new AnimalProjector(prisma);
  }

  /**
   * Creates a new sponsorship
   * - Auto-creates user if email doesn't exist
   * - Records sponsorship on animal aggregate
   */
  async create(dto: CreateSponsorshipDto): Promise<Sponsorship> {
    const currency = dto.currency || 'USD';

    // Verify animal exists
    const animalEvents = await this.eventStore.getEventsForAggregate(dto.animalId);
    if (animalEvents.length === 0) {
      throw new Error(`Animal with id ${dto.animalId} not found`);
    }

    // Load animal aggregate
    const animal = new AnimalAggregate(dto.animalId);
    animal.loadFromHistory(animalEvents);

    if (animal.isDeleted) {
      throw new Error('Cannot sponsor a deleted animal');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Create user without password (sponsor user)
      user = await this.prisma.user.create({
        data: {
          id: generateId(),
          email: dto.email,
          name: dto.name,
          role: 'USER',
        },
      });
    }

    // Create sponsorship aggregate
    const sponsorshipId = generateId();
    const sponsorship = SponsorshipAggregate.create(
      sponsorshipId,
      dto.animalId,
      user.id,
      dto.email,
      dto.amount,
      currency
    );

    // Record sponsorship on animal
    animal.recordSponsorship(sponsorshipId, user.id, dto.amount, currency);

    // Persist sponsorship events
    const sponsorshipEvents = sponsorship.getUncommittedEvents();
    await this.eventStore.append(sponsorshipEvents);

    // Persist animal events (AnimalSponsored)
    const animalNewEvents = animal.getUncommittedEvents();
    await this.eventStore.append(animalNewEvents);

    // Project sponsorship to read model
    for (const event of sponsorshipEvents) {
      await this.sponsorshipProjector.project(event);
    }

    // Project animal update to read model (totalSponsored increment)
    for (const event of animalNewEvents) {
      await this.animalProjector.project(event);
    }

    return this.prisma.sponsorship.findUniqueOrThrow({
      where: { id: sponsorshipId },
      include: { animal: true, user: true },
    });
  }

  /**
   * Gets all sponsorships for an animal
   */
  async findByAnimal(animalId: string): Promise<Sponsorship[]> {
    return this.prisma.sponsorship.findMany({
      where: { animalId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets all sponsorships by a user
   */
  async findByUser(userId: string): Promise<Sponsorship[]> {
    return this.prisma.sponsorship.findMany({
      where: { userId },
      include: { animal: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets recent sponsorships
   */
  async findRecent(limit: number = 10): Promise<Sponsorship[]> {
    return this.prisma.sponsorship.findMany({
      include: { animal: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
