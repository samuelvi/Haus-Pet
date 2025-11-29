import { DomainEvent } from '../../domain/events/DomainEvent';
import { Queue } from 'bullmq';
import redisConnection from '../queue/redis-connection';

/**
 * Event Handler interface
 */
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Event Bus - In-Memory with BullMQ Queue fallback
 *
 * This implementation processes events synchronously in-memory first,
 * but can also queue them for asynchronous processing via BullMQ.
 *
 * For counter updates, we use synchronous processing to ensure consistency.
 * For other side effects (emails, notifications), use async queue processing.
 */
export class EventBus {
  private handlers: Map<string, IEventHandler[]> = new Map();
  private queue: Queue | null = null;

  constructor(private readonly useQueue: boolean = false) {
    if (useQueue) {
      this.queue = new Queue('domain-events', { connection: redisConnection });
    }
  }

  /**
   * Register an event handler for a specific event type
   */
  register<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as IEventHandler);
  }

  /**
   * Publish an event synchronously to all registered handlers
   */
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];

    // Execute all handlers synchronously
    for (const handler of handlers) {
      try {
        await handler.handle(event);
      } catch (error) {
        console.error(
          `Error handling event ${event.eventType}:`,
          error
        );
        // Don't throw - continue processing other handlers
      }
    }

    // Optionally queue for async processing
    if (this.useQueue && this.queue) {
      await this.queue.add('domain-event', {
        eventType: event.eventType,
        payload: event.payload,
        occurredAt: event.occurredAt.toISOString(),
      });
    }
  }

  /**
   * Publish multiple events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(false); // Sync processing for counters
  }
  return eventBusInstance;
}
