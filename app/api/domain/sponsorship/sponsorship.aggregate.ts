import { AggregateRoot, DomainEvent } from '../eventsourcing';
import { SponsorshipEventTypes, SponsorshipCreatedData } from './sponsorship.events';

/**
 * Sponsorship Aggregate Root
 * Represents a single sponsorship transaction
 */
export class SponsorshipAggregate extends AggregateRoot {
  private _animalId: string = '';
  private _userId: string = '';
  private _userEmail: string = '';
  private _amount: number = 0;
  private _currency: string = 'USD';
  private _createdAt: Date = new Date();

  // Getters
  get animalId(): string {
    return this._animalId;
  }

  get userId(): string {
    return this._userId;
  }

  get userEmail(): string {
    return this._userEmail;
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  protected getAggregateType(): string {
    return 'Sponsorship';
  }

  /**
   * Creates a new Sponsorship
   */
  static create(
    id: string,
    animalId: string,
    userId: string,
    userEmail: string,
    amount: number,
    currency: string = 'USD'
  ): SponsorshipAggregate {
    if (amount <= 0) {
      throw new Error('Sponsorship amount must be positive');
    }

    const sponsorship = new SponsorshipAggregate(id);
    sponsorship.raiseEvent(SponsorshipEventTypes.SPONSORSHIP_CREATED, {
      animalId,
      userId,
      userEmail,
      amount,
      currency,
    } as unknown as Record<string, unknown>);
    return sponsorship;
  }

  /**
   * Applies domain events to update aggregate state
   */
  protected applyEvent(event: DomainEvent): void {
    switch (event.eventType) {
      case SponsorshipEventTypes.SPONSORSHIP_CREATED:
        this.applySponsorshipCreated(event.data as unknown as SponsorshipCreatedData);
        break;
    }
  }

  private applySponsorshipCreated(data: SponsorshipCreatedData): void {
    this._animalId = data.animalId;
    this._userId = data.userId;
    this._userEmail = data.userEmail;
    this._amount = data.amount;
    this._currency = data.currency;
    this._createdAt = new Date();
  }
}
