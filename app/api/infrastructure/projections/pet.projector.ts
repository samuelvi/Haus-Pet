import { PrismaClient, PetType } from '@prisma/client';
import { DomainEvent } from '../../domain/eventsourcing';
import {
  PetEventTypes,
  PetCreatedData,
  PetUpdatedData,
  PetSponsoredData,
} from '../../domain/pet';

/**
 * Projects Pet events to the read model
 */
export class PetProjector {
  constructor(private readonly prisma: PrismaClient) {}

  async project(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case PetEventTypes.PET_CREATED:
        await this.handlePetCreated(event);
        break;
      case PetEventTypes.PET_UPDATED:
        await this.handlePetUpdated(event);
        break;
      case PetEventTypes.PET_DELETED:
        await this.handlePetDeleted(event);
        break;
      case PetEventTypes.PET_SPONSORED:
        await this.handlePetSponsored(event);
        break;
      // Legacy event names for backward compatibility
      case 'AnimalCreated':
        await this.handlePetCreated(event);
        break;
      case 'AnimalUpdated':
        await this.handlePetUpdated(event);
        break;
      case 'AnimalDeleted':
        await this.handlePetDeleted(event);
        break;
      case 'AnimalSponsored':
        await this.handlePetSponsored(event);
        break;
    }
  }

  private async handlePetCreated(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as PetCreatedData;
    await this.prisma.pet.create({
      data: {
        id: event.aggregateId,
        name: data.name,
        type: data.type as PetType,
        breed: data.breed,
        photoUrl: data.photoUrl,
        totalSponsored: 0,
      },
    });
  }

  private async handlePetUpdated(event: DomainEvent): Promise<void> {
    const data = event.data as PetUpdatedData;
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type as PetType;
    if (data.breed !== undefined) updateData.breed = data.breed;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

    await this.prisma.pet.update({
      where: { id: event.aggregateId },
      data: updateData,
    });
  }

  private async handlePetDeleted(event: DomainEvent): Promise<void> {
    await this.prisma.pet.delete({
      where: { id: event.aggregateId },
    });
  }

  private async handlePetSponsored(event: DomainEvent): Promise<void> {
    const data = event.data as unknown as PetSponsoredData;
    await this.prisma.pet.update({
      where: { id: event.aggregateId },
      data: {
        totalSponsored: {
          increment: data.amount,
        },
      },
    });
  }
}
