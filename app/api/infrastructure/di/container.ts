/**
 * Dependency Injection Container
 *
 * Central configuration for all application dependencies.
 * This container manages the lifecycle and resolution of all services.
 */

import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from './types';

// Infrastructure
import prisma from '../database/prisma-client';
import { getEventBus } from '../events/EventBus';

// Repositories
import { createBreedRepository } from '../repositories/repository.factory';
import { PostgresBreedTypeRepository } from '../repositories/postgres-breed-type.repository';
import { PrismaSystemCountersRepository } from '../persistence/PrismaSystemCountersRepository';
import { MongoAuditRepository } from '../repositories/mongo-audit.repository';

// Services
import { BreedService } from '../../application/breed.service';
import { BreedTypeService } from '../../application/breed-type.service';
import { SystemCountersService } from '../../application/SystemCountersService';
import { AuditService } from '../../application/audit.service';
import { QueueService } from '../queue/queue.service';
import { RedisHealthService } from '../queue/redis-health.service';

// Controllers
import { BreedController } from '../http/controllers/breed.controller';
import { BreedTypeController } from '../http/controllers/breed-type.controller';
import { SystemCountersController } from '../http/controllers/system-counters.controller';

// Decorators
import { AuditLoggingBreedServiceDecorator } from '../../application/audit-logging-breed.service.decorator';

// External dependencies
import redisConnection from '../queue/redis-connection';

/**
 * Create and configure the DI container
 */
function createContainer(): Container {
  const container = new Container();

  // ========== Infrastructure Bindings ==========
  container.bind(TYPES.PrismaClient).toConstantValue(prisma);
  container.bind(TYPES.EventBus).toConstantValue(getEventBus());

  // ========== Repository Bindings ==========
  const breedRepository = createBreedRepository();
  container.bind(TYPES.BreedReadRepository).toConstantValue(breedRepository);
  container.bind(TYPES.BreedWriteRepository).toConstantValue(breedRepository);

  container
    .bind(TYPES.BreedTypeRepository)
    .toDynamicValue(() => new PostgresBreedTypeRepository(prisma))
    .inSingletonScope();

  container
    .bind(TYPES.SystemCountersRepository)
    .toDynamicValue(() => new PrismaSystemCountersRepository(prisma))
    .inSingletonScope();

  container
    .bind(TYPES.AuditRepository)
    .to(MongoAuditRepository)
    .inSingletonScope();

  // ========== Service Bindings ==========

  // Core BreedService (without decorators)
  container
    .bind(BreedService)
    .toDynamicValue(() => {
      return new BreedService(
        container.get(TYPES.BreedReadRepository),
        container.get(TYPES.BreedWriteRepository),
        container.get(TYPES.BreedTypeRepository),
        container.get(TYPES.EventBus)
      );
    })
    .inSingletonScope();

  // Decorated BreedService (for controllers)
  container
    .bind(TYPES.BreedService)
    .toDynamicValue(() => {
      const baseService = container.get(BreedService) as BreedService;
      const auditService = container.get(TYPES.AuditService) as AuditService;
      const queueService = container.get(TYPES.QueueService) as QueueService;
      const redisHealthService = container.get(TYPES.RedisHealthService) as RedisHealthService;

      return new AuditLoggingBreedServiceDecorator(
        baseService,
        auditService,
        queueService,
        redisHealthService
      );
    })
    .inSingletonScope();

  container
    .bind(TYPES.BreedTypeService)
    .toDynamicValue(() => {
      return new BreedTypeService(
        container.get(TYPES.BreedTypeRepository),
        container.get(TYPES.EventBus)
      );
    })
    .inSingletonScope();

  container
    .bind(TYPES.SystemCountersService)
    .toDynamicValue(() => {
      return new SystemCountersService(
        container.get(TYPES.SystemCountersRepository)
      );
    })
    .inSingletonScope();

  container
    .bind(TYPES.AuditService)
    .toDynamicValue(() => {
      return new AuditService(container.get(TYPES.AuditRepository));
    })
    .inSingletonScope();

  container.bind(TYPES.QueueService).to(QueueService).inSingletonScope();

  container
    .bind(TYPES.RedisHealthService)
    .toDynamicValue(() => new RedisHealthService(redisConnection))
    .inSingletonScope();

  // ========== Controller Bindings ==========
  container
    .bind(TYPES.BreedController)
    .toDynamicValue(() => {
      return new BreedController(container.get(TYPES.BreedService));
    })
    .inSingletonScope();

  container
    .bind(TYPES.BreedTypeController)
    .toDynamicValue(() => {
      return new BreedTypeController(
        container.get(TYPES.BreedTypeService)
      );
    })
    .inSingletonScope();

  container
    .bind(TYPES.SystemCountersController)
    .toDynamicValue(() => {
      return new SystemCountersController(
        container.get(TYPES.SystemCountersService)
      );
    })
    .inSingletonScope();

  return container;
}

// Export singleton container instance
export const container = createContainer();
