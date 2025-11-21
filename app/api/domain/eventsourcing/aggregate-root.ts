import { DomainEvent, createDomainEvent } from './domain-event';

/**
 * Base class for all aggregate roots in the Event Sourcing system.
 * Aggregates encapsulate business logic and produce domain events.
 */
export abstract class AggregateRoot {
  protected _id: string;
  protected _version: number = 0;
  private _uncommittedEvents: DomainEvent[] = [];

  constructor(id: string) {
    this._id = id;
  }

  get id(): string {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  /**
   * Returns all uncommitted events (changes that haven't been persisted yet)
   */
  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  /**
   * Clears uncommitted events after they have been persisted
   */
  clearUncommittedEvents(): void {
    this._uncommittedEvents = [];
  }

  /**
   * Apply an event to update the aggregate state.
   * Called both when raising new events and when replaying history.
   */
  protected abstract applyEvent(event: DomainEvent): void;

  /**
   * Raises a new domain event, applies it to the aggregate, and stores it as uncommitted
   */
  protected raiseEvent(
    eventType: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): void {
    this._version += 1;
    const event = createDomainEvent(
      eventType,
      this._id,
      this.getAggregateType(),
      this._version,
      data,
      metadata
    );
    this.applyEvent(event);
    this._uncommittedEvents.push(event);
  }

  /**
   * Returns the aggregate type name (e.g., "Animal", "Sponsorship")
   */
  protected abstract getAggregateType(): string;

  /**
   * Loads the aggregate from a stream of historical events
   */
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.applyEvent(event);
      this._version = event.version;
    }
  }
}
