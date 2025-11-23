import { AggregateRoot, DomainEvent } from '../eventsourcing';
import { SponsorshipEventTypes, SponsorshipCreatedData } from './sponsorship.events';

/**
 * Sponsorship Aggregate Root
 * Represents a single sponsorship transaction
 */
export class SponsorshipAggregate extends AggregateRoot {
  private _petId: string = '';
  private _userId: string = '';
  private _userEmail: string = '';
  private _amount: number = 0;
  private _currency: string = 'USD';
  private _createdAt: Date = new Date();

  // Getters
  get petId(): string {
    return this._petId;
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
    petId: string,
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
      petId,
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
    this._petId = data.petId;
    this._userId = data.userId;
    this._userEmail = data.userEmail;
    this._amount = data.amount;
    this._currency = data.currency;
    this._createdAt = new Date();
  }
}
