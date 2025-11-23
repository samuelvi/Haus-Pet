import { PrismaClient, Sponsorship } from '@prisma/client';
import { SponsorshipAggregate } from '../domain/sponsorship';
import { PetAggregate } from '../domain/pet';
import { EventStoreRepository } from '../domain/eventsourcing';
import { SponsorshipProjector, PetProjector } from '../infrastructure/projections';
import { generateId } from '../infrastructure/utils/uuid';

export interface CreateSponsorshipDto {
  petId: string;
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
  private readonly petProjector: PetProjector;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventStore: EventStoreRepository
  ) {
    this.sponsorshipProjector = new SponsorshipProjector(prisma);
    this.petProjector = new PetProjector(prisma);
  }

  /**
   * Creates a new sponsorship
   * - Auto-creates user if email doesn't exist
   * - Records sponsorship on pet aggregate
   */
  async create(dto: CreateSponsorshipDto): Promise<Sponsorship> {
    const currency = dto.currency || 'USD';

    // Verify pet exists (event-sourced path or fallback to read model)
    const petEvents = await this.eventStore.getEventsForAggregate(dto.petId);

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

    // If we have history, go through aggregate/eventsourcing path
    if (petEvents.length > 0) {
      const pet = new PetAggregate(dto.petId);
      pet.loadFromHistory(petEvents);

      if (pet.isDeleted) {
        throw new Error('Cannot sponsor a deleted pet');
      }

      const sponsorshipId = generateId();
      const sponsorship = SponsorshipAggregate.create(
        sponsorshipId,
        dto.petId,
        user.id,
        dto.email,
        dto.amount,
        currency
      );

      // Record sponsorship on pet
      pet.recordSponsorship(sponsorshipId, user.id, dto.amount, currency);

      // Persist sponsorship events
      const sponsorshipEvents = sponsorship.getUncommittedEvents();
      await this.eventStore.append(sponsorshipEvents);

      // Persist pet events (PetSponsored)
      const petNewEvents = pet.getUncommittedEvents();
      await this.eventStore.append(petNewEvents);

      // Project sponsorship to read model
      for (const event of sponsorshipEvents) {
        await this.sponsorshipProjector.project(event);
      }

      // Project pet update to read model (totalSponsored increment)
      for (const event of petNewEvents) {
        await this.petProjector.project(event);
      }

      return this.prisma.sponsorship.findUniqueOrThrow({
        where: { id: sponsorshipId },
        include: { pet: true, user: true },
      });
    }

    // Fallback: no event history, use read model directly
    const petRecord = await this.prisma.pet.findUnique({ where: { id: dto.petId } });
    if (!petRecord) {
      throw new Error(`Pet with id ${dto.petId} not found`);
    }

    const created = await this.prisma.sponsorship.create({
      data: {
        id: generateId(),
        petId: dto.petId,
        userId: user.id,
        amount: dto.amount,
        currency,
      },
      include: { pet: true, user: true },
    });

    await this.prisma.pet.update({
      where: { id: dto.petId },
      data: {
        totalSponsored: {
          increment: dto.amount,
        },
      },
    });

    return created;
  }

  /**
   * Gets all sponsorships for a pet
   */
  async findByPet(petId: string): Promise<Sponsorship[]> {
    return this.prisma.sponsorship.findMany({
      where: { petId },
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
      include: { pet: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets recent sponsorships
   */
  async findRecent(limit: number = 10): Promise<Sponsorship[]> {
    return this.prisma.sponsorship.findMany({
      include: { pet: true, user: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
