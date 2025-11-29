/**
 * Dependency Injection Types
 *
 * Defines symbols for all injectable types in the application.
 * Using symbols ensures type-safe dependency injection.
 */

export const TYPES = {
  // ========== Infrastructure ==========
  PrismaClient: Symbol.for('PrismaClient'),
  EventBus: Symbol.for('EventBus'),

  // ========== Repositories ==========
  BreedReadRepository: Symbol.for('BreedReadRepository'),
  BreedWriteRepository: Symbol.for('BreedWriteRepository'),
  BreedTypeRepository: Symbol.for('BreedTypeRepository'),
  SystemCountersRepository: Symbol.for('SystemCountersRepository'),

  // ========== Services ==========
  BreedService: Symbol.for('BreedService'),
  BreedTypeService: Symbol.for('BreedTypeService'),
  SystemCountersService: Symbol.for('SystemCountersService'),

  // ========== Controllers ==========
  BreedController: Symbol.for('BreedController'),
  BreedTypeController: Symbol.for('BreedTypeController'),
  SystemCountersController: Symbol.for('SystemCountersController'),

  // ========== Audit (Decorators) ==========
  AuditRepository: Symbol.for('AuditRepository'),
  AuditService: Symbol.for('AuditService'),
  QueueService: Symbol.for('QueueService'),
  RedisHealthService: Symbol.for('RedisHealthService'),
};
