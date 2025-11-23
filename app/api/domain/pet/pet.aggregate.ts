import { AggregateRoot, DomainEvent } from '../eventsourcing';
import {
  PetEventTypes,
  PetCreatedData,
  PetUpdatedData,
  PetSponsoredData,
} from './pet.events';

/**
 * Pet Aggregate Root
 * Encapsulates all business logic related to pets and their sponsorships
 */
export class PetAggregate extends AggregateRoot {
  private _name: string = '';
  private _type: 'cat' | 'dog' | 'bird' = 'cat';
  private _breed: string = '';
  private _photoUrl: string = '';
  private _totalSponsored: number = 0;
  private _isDeleted: boolean = false;

  get name(): string {
    return this._name;
  }

  get type(): 'cat' | 'dog' | 'bird' {
    return this._type;
  }

  get breed(): string {
    return this._breed;
  }

  get photoUrl(): string {
    return this._photoUrl;
  }

  get totalSponsored(): number {
    return this._totalSponsored;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  protected getAggregateType(): string {
    return 'Pet';
  }

  /**
   * Creates a new Pet
   */
  static create(
    id: string,
    name: string,
    type: 'cat' | 'dog' | 'bird',
    breed: string,
    photoUrl: string
  ): PetAggregate {
    const pet = new PetAggregate(id);
    pet.raiseEvent(PetEventTypes.PET_CREATED, {
      name,
      type,
      breed,
      photoUrl,
    } as unknown as Record<string, unknown>);
    return pet;
  }

  /**
   * Updates pet information
   */
  update(data: PetUpdatedData): void {
    if (this._isDeleted) {
      throw new Error('Cannot update a deleted pet');
    }
    this.raiseEvent(PetEventTypes.PET_UPDATED, data as unknown as Record<string, unknown>);
  }

  /**
   * Marks the pet as deleted
   */
  delete(): void {
    if (this._isDeleted) {
      throw new Error('Pet is already deleted');
    }
    this.raiseEvent(PetEventTypes.PET_DELETED, {
      deletedAt: new Date().toISOString(),
    });
  }

  /**
   * Records a sponsorship for this pet
   */
  recordSponsorship(
    sponsorshipId: string,
    userId: string,
    amount: number,
    currency: string = 'USD'
  ): void {
    if (this._isDeleted) {
      throw new Error('Cannot sponsor a deleted pet');
    }
    if (amount <= 0) {
      throw new Error('Sponsorship amount must be positive');
    }
    this.raiseEvent(PetEventTypes.PET_SPONSORED, {
      sponsorshipId,
      userId,
      amount,
      currency,
    } as unknown as Record<string, unknown>);
  }

  /**
   * Applies domain events to update aggregate state
   */
  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case PetEventTypes.PET_CREATED:
        this.applyPetCreated(event.data as unknown as PetCreatedData);
        break;
      case PetEventTypes.PET_UPDATED:
        this.applyPetUpdated(event.data as unknown as PetUpdatedData);
        break;
      case PetEventTypes.PET_DELETED:
        this._isDeleted = true;
        break;
      case PetEventTypes.PET_SPONSORED:
        this.applyPetSponsored(event.data as unknown as PetSponsoredData);
        break;
      // Legacy support for previously named Animal events
      case 'AnimalCreated':
        this.applyPetCreated(event.data as unknown as PetCreatedData);
        break;
      case 'AnimalUpdated':
        this.applyPetUpdated(event.data as unknown as PetUpdatedData);
        break;
      case 'AnimalDeleted':
        this._isDeleted = true;
        break;
      case 'AnimalSponsored':
        this.applyPetSponsored(event.data as unknown as PetSponsoredData);
        break;
    }
  }

  private applyPetCreated(data: PetCreatedData): void {
    this._name = data.name;
    this._type = data.type;
    this._breed = data.breed;
    this._photoUrl = data.photoUrl;
  }

  private applyPetUpdated(data: PetUpdatedData): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.type !== undefined) this._type = data.type;
    if (data.breed !== undefined) this._breed = data.breed;
    if (data.photoUrl !== undefined) this._photoUrl = data.photoUrl;
  }

  private applyPetSponsored(data: PetSponsoredData): void {
    this._totalSponsored += data.amount;
  }
}
