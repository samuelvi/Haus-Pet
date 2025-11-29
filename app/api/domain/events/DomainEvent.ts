/**
 * Base Domain Event
 *
 * All domain events should extend this interface.
 * Events are used to trigger side effects like updating counters.
 */
export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, any>;
}

/**
 * Breed Created Event
 */
export class BreedCreatedEvent implements DomainEvent {
  readonly eventType = 'BreedCreated';
  readonly occurredAt: Date;

  constructor(
    public readonly payload: {
      breedId: string;
      name: string;
      breedTypeId: string;
    }
  ) {
    this.occurredAt = new Date();
  }
}

/**
 * Breed Deleted Event
 */
export class BreedDeletedEvent implements DomainEvent {
  readonly eventType = 'BreedDeleted';
  readonly occurredAt: Date;

  constructor(
    public readonly payload: {
      breedId: string;
    }
  ) {
    this.occurredAt = new Date();
  }
}

/**
 * Breed Type Created Event
 */
export class BreedTypeCreatedEvent implements DomainEvent {
  readonly eventType = 'BreedTypeCreated';
  readonly occurredAt: Date;

  constructor(
    public readonly payload: {
      breedTypeId: string;
      name: string;
    }
  ) {
    this.occurredAt = new Date();
  }
}

/**
 * Breed Type Deleted Event
 */
export class BreedTypeDeletedEvent implements DomainEvent {
  readonly eventType = 'BreedTypeDeleted';
  readonly occurredAt: Date;

  constructor(
    public readonly payload: {
      breedTypeId: string;
    }
  ) {
    this.occurredAt = new Date();
  }
}

/**
 * Pet Created Event
 */
export class PetCreatedEvent implements DomainEvent {
  readonly eventType = 'PetCreated';
  readonly occurredAt: Date;

  constructor(
    public readonly payload: {
      petId: string;
      name: string;
      type: string;
    }
  ) {
    this.occurredAt = new Date();
  }
}

/**
 * Pet Deleted Event
 */
export class PetDeletedEvent implements DomainEvent {
  readonly eventType = 'PetDeleted';
  readonly occurredAt: Date;

  constructor(
    public readonly payload: {
      petId: string;
    }
  ) {
    this.occurredAt = new Date();
  }
}

/**
 * Sponsorship Created Event
 */
export class SponsorshipCreatedEvent implements DomainEvent {
  readonly eventType = 'SponsorshipCreated';
  readonly occurredAt: Date;

  constructor(
    public readonly payload: {
      sponsorshipId: string;
      petId: string;
      userId: string;
      amount: number;
    }
  ) {
    this.occurredAt = new Date();
  }
}

/**
 * User Registered Event
 */
export class UserRegisteredEvent implements DomainEvent {
  readonly eventType = 'UserRegistered';
  readonly occurredAt: Date;

  constructor(
    public readonly payload: {
      userId: string;
      email: string;
      role: string;
    }
  ) {
    this.occurredAt = new Date();
  }
}
