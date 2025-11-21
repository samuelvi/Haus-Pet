import { AggregateRoot, DomainEvent } from '../eventsourcing';
import {
  AnimalEventTypes,
  AnimalCreatedData,
  AnimalUpdatedData,
  AnimalSponsoredData,
} from './animal.events';

/**
 * Animal Aggregate Root
 * Encapsulates all business logic related to animals and their sponsorships
 */
export class AnimalAggregate extends AggregateRoot {
  private _name: string = '';
  private _type: 'cat' | 'dog' | 'bird' = 'cat';
  private _breed: string = '';
  private _photoUrl: string = '';
  private _totalSponsored: number = 0;
  private _isDeleted: boolean = false;

  // Getters
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
    return 'Animal';
  }

  /**
   * Creates a new Animal
   */
  static create(
    id: string,
    name: string,
    type: 'cat' | 'dog' | 'bird',
    breed: string,
    photoUrl: string
  ): AnimalAggregate {
    const animal = new AnimalAggregate(id);
    animal.raiseEvent(AnimalEventTypes.ANIMAL_CREATED, {
      name,
      type,
      breed,
      photoUrl,
    } as unknown as Record<string, unknown>);
    return animal;
  }

  /**
   * Updates animal information
   */
  update(data: AnimalUpdatedData): void {
    if (this._isDeleted) {
      throw new Error('Cannot update a deleted animal');
    }
    this.raiseEvent(AnimalEventTypes.ANIMAL_UPDATED, data as unknown as Record<string, unknown>);
  }

  /**
   * Marks the animal as deleted
   */
  delete(): void {
    if (this._isDeleted) {
      throw new Error('Animal is already deleted');
    }
    this.raiseEvent(AnimalEventTypes.ANIMAL_DELETED, {
      deletedAt: new Date().toISOString(),
    });
  }

  /**
   * Records a sponsorship for this animal
   */
  recordSponsorship(
    sponsorshipId: string,
    userId: string,
    amount: number,
    currency: string = 'USD'
  ): void {
    if (this._isDeleted) {
      throw new Error('Cannot sponsor a deleted animal');
    }
    if (amount <= 0) {
      throw new Error('Sponsorship amount must be positive');
    }
    this.raiseEvent(AnimalEventTypes.ANIMAL_SPONSORED, {
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
      case AnimalEventTypes.ANIMAL_CREATED:
        this.applyAnimalCreated(event.data as unknown as AnimalCreatedData);
        break;
      case AnimalEventTypes.ANIMAL_UPDATED:
        this.applyAnimalUpdated(event.data as AnimalUpdatedData);
        break;
      case AnimalEventTypes.ANIMAL_DELETED:
        this._isDeleted = true;
        break;
      case AnimalEventTypes.ANIMAL_SPONSORED:
        this.applyAnimalSponsored(event.data as unknown as AnimalSponsoredData);
        break;
    }
  }

  private applyAnimalCreated(data: AnimalCreatedData): void {
    this._name = data.name;
    this._type = data.type;
    this._breed = data.breed;
    this._photoUrl = data.photoUrl;
  }

  private applyAnimalUpdated(data: AnimalUpdatedData): void {
    if (data.name !== undefined) this._name = data.name;
    if (data.type !== undefined) this._type = data.type;
    if (data.breed !== undefined) this._breed = data.breed;
    if (data.photoUrl !== undefined) this._photoUrl = data.photoUrl;
  }

  private applyAnimalSponsored(data: AnimalSponsoredData): void {
    this._totalSponsored += data.amount;
  }
}
