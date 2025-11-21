import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../domain/eventsourcing';
import { SponsorshipEventTypes, SponsorshipCreatedData } from '../../domain/sponsorship';

/**
 * Projects Sponsorship events to the read model
 */
export class SponsorshipProjector {
  constructor(private readonly prisma: PrismaClient) {}

  async project(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case SponsorshipEventTypes.SPONSORSHIP_CREATED:
        await this.handleSponsorshipCreated(event);
        break;
    }
  }

  private async handleSponsorshipCreated(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as SponsorshipCreatedData;
    await this.prisma.sponsorship.create({
      data: {
        id: event.aggregateId,
        animalId: data.animalId,
        userId: data.userId,
        amount: data.amount,
        currency: data.currency,
      },
    });
  }
}
