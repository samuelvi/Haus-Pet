import { DomainEvent } from './domain-event';

/**
 * Repository interface for the Event Store.
 * Defines operations for storing and retrieving domain events.
 */
export interface EventStoreRepository {
  /**
   * Appends new events to the event store.
   * @param events - Array of domain events to persist
   * @throws ConcurrencyError if expected version doesn't match
   */
  append(events: DomainEvent[]): Promise<void>;

  /**
   * Retrieves all events for a specific aggregate.
   * @param aggregateId - The ID of the aggregate
   * @returns Array of domain events in chronological order
   */
  getEventsForAggregate(aggregateId: string): Promise<DomainEvent[]>;

  /**
   * Retrieves all events of a specific type.
   * @param eventType - The type of events to retrieve
   * @returns Array of domain events
   */
  getEventsByType(eventType: string): Promise<DomainEvent[]>;

  /**
   * Retrieves all events for aggregates of a specific type.
   * @param aggregateType - The type of aggregate (e.g., "Animal")
   * @returns Array of domain events
   */
  getEventsByAggregateType(aggregateType: string): Promise<DomainEvent[]>;
}

/**
 * Error thrown when there's a concurrency conflict
 */
export class ConcurrencyError extends Error {
  constructor(aggregateId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrency conflict for aggregate ${aggregateId}. ` +
      `Expected version ${expectedVersion}, but found ${actualVersion}.`
    );
    this.name = 'ConcurrencyError';
  }
}
