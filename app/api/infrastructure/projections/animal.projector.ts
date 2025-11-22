import { PrismaClient, AnimalType } from '@prisma/client';
import { DomainEvent } from '../../domain/eventsourcing';
import {
  AnimalEventTypes,
  AnimalCreatedData,
  AnimalUpdatedData,
  AnimalSponsoredData,
} from '../../domain/animal';

/**
 * Projects Animal events to the read model
 */
export class AnimalProjector {
  constructor(private readonly prisma: PrismaClient) {}

  async project(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case AnimalEventTypes.ANIMAL_CREATED:
        await this.handleAnimalCreated(event);
        break;
      case AnimalEventTypes.ANIMAL_UPDATED:
        await this.handleAnimalUpdated(event);
        break;
      case AnimalEventTypes.ANIMAL_DELETED:
        await this.handleAnimalDeleted(event);
        break;
      case AnimalEventTypes.ANIMAL_SPONSORED:
        await this.handleAnimalSponsored(event);
        break;
    }
  }

  private async handleAnimalCreated(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as AnimalCreatedData;
    await this.prisma.animal.create({
      data: {
        id: event.aggregateId,
        name: data.name,
        type: data.type as AnimalType,
        breed: data.breed,
        photoUrl: data.photoUrl,
        totalSponsored: 0,
      },
    });
  }

  private async handleAnimalUpdated(event: DomainEvent): Promise<void> {
    const data = event.data as AnimalUpdatedData;
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type as AnimalType;
    if (data.breed !== undefined) updateData.breed = data.breed;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

    await this.prisma.animal.update({
      where: { id: event.aggregateId },
      data: updateData,
    });
  }

  private async handleAnimalDeleted(event: DomainEvent): Promise<void> {
    await this.prisma.animal.delete({
      where: { id: event.aggregateId },
    });
  }

  private async handleAnimalSponsored(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as AnimalSponsoredData;
    await this.prisma.animal.update({
      where: { id: event.aggregateId },
      data: {
        totalSponsored: {
          increment: data.amount,
        },
      },
    });
  }
}
