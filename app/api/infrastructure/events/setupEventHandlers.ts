/**
 * Setup Event Handlers
 *
 * Registers all event handlers with the event bus.
 * This should be called once during application startup.
 */
import { EventBus } from './EventBus';
import { SystemCountersService } from '../../application/SystemCountersService';
import {
  BreedCreatedHandler,
  BreedDeletedHandler,
  BreedTypeCreatedHandler,
  BreedTypeDeletedHandler,
  PetCreatedHandler,
  PetDeletedHandler,
  SponsorshipCreatedHandler,
  UserRegisteredHandler,
} from '../../application/event-handlers/CounterEventHandlers';

export function setupEventHandlers(
  eventBus: EventBus,
  countersService: SystemCountersService
): void {
  // Register Breed event handlers
  eventBus.register('BreedCreated', new BreedCreatedHandler(countersService));
  eventBus.register('BreedDeleted', new BreedDeletedHandler(countersService));

  // Register Breed Type event handlers
  eventBus.register(
    'BreedTypeCreated',
    new BreedTypeCreatedHandler(countersService)
  );
  eventBus.register(
    'BreedTypeDeleted',
    new BreedTypeDeletedHandler(countersService)
  );

  // Register Pet event handlers
  eventBus.register('PetCreated', new PetCreatedHandler(countersService));
  eventBus.register('PetDeleted', new PetDeletedHandler(countersService));

  // Register Sponsorship event handlers
  eventBus.register(
    'SponsorshipCreated',
    new SponsorshipCreatedHandler(countersService)
  );

  // Register User event handlers
  eventBus.register(
    'UserRegistered',
    new UserRegisteredHandler(countersService)
  );

  console.log(
    '✅ Event handlers registered:',
    eventBus.getRegisteredEventTypes().join(', ')
  );
}
