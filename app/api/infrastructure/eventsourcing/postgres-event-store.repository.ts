import { PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../domain/eventsourcing/domain-event';
import { EventStoreRepository, ConcurrencyError } from '../../domain/eventsourcing/event-store.repository';

/**
 * PostgreSQL implementation of the Event Store using Prisma.
 */
export class PostgresEventStoreRepository implements EventStoreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Check for concurrency conflicts for the first event's aggregate
    const firstEvent = events[0];
    const existingEvents = await this.prisma.event.findMany({
      where: { aggregateId: firstEvent.aggregateId },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const currentVersion = existingEvents.length > 0 ? existingEvents[0].version : 0;
    const expectedVersion = firstEvent.version - 1;

    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyError(firstEvent.aggregateId, expectedVersion, currentVersion);
    }

    // Insert all events in a transaction
    await this.prisma.$transaction(
      events.map((event) =>
        this.prisma.event.create({
          data: {
            id: event.eventId,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            eventType: event.eventType,
            eventData: event.data as object,
            metadata: event.metadata as object | undefined,
            version: event.version,
            timestamp: event.timestamp,
          },
        })
      )
    );
  }

  async getEventsForAggregate(aggregateId: string): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { aggregateId },
      orderBy: { version: 'asc' },
    });

    return events.map(this.mapToDomainEvent);
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { eventType },
      orderBy: { timestamp: 'asc' },
    });

    return events.map(this.mapToDomainEvent);
  }

  async getEventsByAggregateType(aggregateType: string): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { aggregateType },
      orderBy: { timestamp: 'asc' },
    });

    return events.map(this.mapToDomainEvent);
  }

  private mapToDomainEvent(event: {
    id: string;
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventData: unknown;
    metadata: unknown;
    version: number;
    timestamp: Date;
  }): DomainEvent {
    return {
      eventId: event.id,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventType: event.eventType,
      version: event.version,
      timestamp: event.timestamp,
      data: event.eventData as Record<string, unknown>,
      metadata: event.metadata as Record<string, unknown> | undefined,
    };
  }
}
