import { IEventHandler } from '../../infrastructure/events/EventBus';
import {
  BreedCreatedEvent,
  BreedDeletedEvent,
  BreedTypeCreatedEvent,
  BreedTypeDeletedEvent,
  PetCreatedEvent,
  PetDeletedEvent,
  SponsorshipCreatedEvent,
  UserRegisteredEvent,
} from '../../domain/events/DomainEvent';
import { SystemCountersService } from '../SystemCountersService';

/**
 * Handler for Breed Created events
 */
export class BreedCreatedHandler implements IEventHandler<BreedCreatedEvent> {
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: BreedCreatedEvent): Promise<void> {
    await this.countersService.incrementBreeds();
  }
}

/**
 * Handler for Breed Deleted events
 */
export class BreedDeletedHandler implements IEventHandler<BreedDeletedEvent> {
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: BreedDeletedEvent): Promise<void> {
    await this.countersService.decrementBreeds();
  }
}

/**
 * Handler for Breed Type Created events
 */
export class BreedTypeCreatedHandler
  implements IEventHandler<BreedTypeCreatedEvent>
{
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: BreedTypeCreatedEvent): Promise<void> {
    await this.countersService.incrementBreedTypes();
  }
}

/**
 * Handler for Breed Type Deleted events
 */
export class BreedTypeDeletedHandler
  implements IEventHandler<BreedTypeDeletedEvent>
{
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: BreedTypeDeletedEvent): Promise<void> {
    await this.countersService.decrementBreedTypes();
  }
}

/**
 * Handler for Pet Created events
 */
export class PetCreatedHandler implements IEventHandler<PetCreatedEvent> {
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: PetCreatedEvent): Promise<void> {
    await this.countersService.incrementPets();
  }
}

/**
 * Handler for Pet Deleted events
 */
export class PetDeletedHandler implements IEventHandler<PetDeletedEvent> {
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: PetDeletedEvent): Promise<void> {
    await this.countersService.decrementPets();
  }
}

/**
 * Handler for Sponsorship Created events
 */
export class SponsorshipCreatedHandler
  implements IEventHandler<SponsorshipCreatedEvent>
{
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: SponsorshipCreatedEvent): Promise<void> {
    await this.countersService.incrementSponsorships(
      1,
      event.payload.amount
    );
  }
}

/**
 * Handler for User Registered events
 */
export class UserRegisteredHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.countersService.incrementUsers();
  }
}
