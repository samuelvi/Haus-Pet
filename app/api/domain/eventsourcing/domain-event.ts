/**
 * Base interface for all domain events in the Event Sourcing system.
 * Every event must have these properties to be stored and replayed.
 */
export interface DomainEvent {
  /** Unique identifier for the event */
  readonly eventId: string;
  /** Type of the event (e.g., "AnimalCreated", "SponsorshipMade") */
  readonly eventType: string;
  /** ID of the aggregate this event belongs to */
  readonly aggregateId: string;
  /** Type of aggregate (e.g., "Animal", "Sponsorship") */
  readonly aggregateType: string;
  /** Version number for optimistic concurrency */
  readonly version: number;
  /** When the event occurred */
  readonly timestamp: Date;
  /** Event-specific payload */
  readonly data: Record<string, unknown>;
  /** Optional metadata (user, IP, etc.) */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Factory function to create a new domain event
 */
export function createDomainEvent(
  eventType: string,
  aggregateId: string,
  aggregateType: string,
  version: number,
  data: Record<string, unknown>,
  metadata?: Record<string, unknown>
): DomainEvent {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    aggregateId,
    aggregateType,
    version,
    timestamp: new Date(),
    data,
    metadata,
  };
}
