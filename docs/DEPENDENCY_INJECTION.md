# Dependency Injection con InversifyJS

## Índice

1. [Introducción](#introducción)
2. [¿Qué es Dependency Injection?](#qué-es-dependency-injection)
3. [¿Por qué InversifyJS?](#por-qué-inversifyjs)
4. [Arquitectura](#arquitectura)
5. [Configuración](#configuración)
6. [Uso](#uso)
7. [Testing](#testing)
8. [Mejores Prácticas](#mejores-prácticas)
9. [Troubleshooting](#troubleshooting)

---

## Introducción

HausPet utiliza **InversifyJS** como contenedor de Dependency Injection (DI) para gestionar las dependencias de la aplicación. Este documento explica cómo funciona el sistema de DI y cómo trabajar con él.

### Beneficios de DI en HausPet

✅ **Código más limpio**: Los routers ya no crean manualmente todas las dependencias
✅ **Testing más fácil**: Fácil inyectar mocks para tests
✅ **Singleton garantizado**: Los servicios se crean una sola vez
✅ **Menos acoplamiento**: Los componentes no conocen cómo se crean sus dependencias
✅ **Más mantenible**: Cambiar un constructor no requiere actualizar todos los archivos

---

## ¿Qué es Dependency Injection?

### Antes (Sin DI - Manual):

```typescript
// routes/api/breed.router.ts
const breedRepository = createBreedRepository();
const breedTypeRepository = new PostgresBreedTypeRepository(prisma);
const eventBus = getEventBus();
const breedService = new BreedService(
  breedRepository,
  breedRepository,
  breedTypeRepository,
  eventBus
);
const auditRepository = new MongoAuditRepository();
const auditService = new AuditService(auditRepository);
const queueService = new QueueService();
const redisHealthService = new RedisHealthService(redisConnection);
const decoratedBreedService = new AuditLoggingBreedServiceDecorator(
  breedService,
  auditService,
  queueService,
  redisHealthService
);
const breedController = new BreedController(decoratedBreedService);
```

**Problemas:**
- ❌ 15+ líneas de setup en cada router
- ❌ Duplicación de código
- ❌ Difícil de testear (no puedes inyectar mocks)
- ❌ No hay singleton real (se crean múltiples instancias)

### Después (Con DI - InversifyJS):

```typescript
// routes/api/breed.router.ts
import { container } from '../../infrastructure/di/container';
import { TYPES } from '../../infrastructure/di/types';

const breedController = container.get<BreedController>(TYPES.BreedController);
```

**Beneficios:**
- ✅ Solo 3 líneas
- ✅ Todas las dependencias se resuelven automáticamente
- ✅ Fácil inyectar mocks en tests
- ✅ Singleton garantizado

---

## ¿Por qué InversifyJS?

### Comparación con Alternativas

| Característica | InversifyJS | TSyringe | Awilix | NestJS |
|----------------|-------------|----------|--------|--------|
| **Tipo** | Librería DI | Librería DI | Librería DI | Framework |
| **Descargas/semana** | ~1.5M | ~700K | ~230K | ~4.5M |
| **Flexibilidad** | Alta | Alta | Alta | Baja |
| **Curva aprendizaje** | Media | Baja | Media | Alta |
| **Type Safety** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Ecosistema** | Grande | Medio | Pequeño | Enorme |
| **Requiere reescribir** | NO | NO | NO | SÍ |

**Elegimos InversifyJS porque:**
1. Es la librería standalone más adoptada
2. No requiere reescribir el proyecto existente
3. Se integra perfectamente con Express
4. Excelente documentación y comunidad
5. Compatible con arquitectura DDD/Clean Architecture

---

## Arquitectura

### Estructura de Archivos

```
app/api/
├── infrastructure/
│   └── di/
│       ├── container.ts    # Configuración del contenedor DI
│       └── types.ts        # Símbolos para todas las dependencias
├── application/
│   ├── breed.service.ts
│   ├── breed-type.service.ts
│   └── SystemCountersService.ts
├── infrastructure/
│   ├── http/
│   │   └── controllers/
│   ├── repositories/
│   └── persistence/
└── routes/
    └── api/
        ├── breed.router.ts
        └── admin/
            ├── breed-type.router.ts
            └── system-counters-instance.router.ts
```

### Flujo de Resolución

```
1. App startup
   │
   ▼
2. app.ts importa container
   │
   ▼
3. Container crea y registra todos los bindings
   │
   ▼
4. Router solicita BreedController
   │
   ▼
5. Container resuelve dependencias recursivamente:
   BreedController → BreedService → [BreedRepository, BreedTypeRepository, EventBus]
   │
   ▼
6. Retorna instancia totalmente configurada
```

---

## Configuración

### 1. Dependencias

El proyecto ya tiene instaladas las dependencias necesarias:

```json
{
  "dependencies": {
    "inversify": "^6.x",
    "reflect-metadata": "^0.x"
  }
}
```

### 2. TypeScript Configuration

En `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true
  }
}
```

### 3. Tipos de Dependencias (`infrastructure/di/types.ts`)

Define símbolos únicos para cada tipo inyectable:

```typescript
export const TYPES = {
  // Infrastructure
  PrismaClient: Symbol.for('PrismaClient'),
  EventBus: Symbol.for('EventBus'),

  // Repositories
  BreedRepository: Symbol.for('BreedRepository'),
  SystemCountersRepository: Symbol.for('SystemCountersRepository'),

  // Services
  BreedService: Symbol.for('BreedService'),
  SystemCountersService: Symbol.for('SystemCountersService'),

  // Controllers
  BreedController: Symbol.for('BreedController'),
  SystemCountersController: Symbol.for('SystemCountersController'),
};
```

### 4. Container Configuration (`infrastructure/di/container.ts`)

Configura cómo se crean todas las dependencias:

```typescript
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from './types';

function createContainer(): Container {
  const container = new Container();

  // Bind Repositories
  container
    .bind(TYPES.BreedTypeRepository)
    .toDynamicValue(() => new PostgresBreedTypeRepository(prisma))
    .inSingletonScope();

  // Bind Services
  container
    .bind(TYPES.BreedTypeService)
    .toDynamicValue(() => {
      return new BreedTypeService(
        container.get(TYPES.BreedTypeRepository),
        container.get(TYPES.EventBus)
      );
    })
    .inSingletonScope();

  // Bind Controllers
  container
    .bind(TYPES.BreedTypeController)
    .toDynamicValue(() => {
      return new BreedTypeController(
        container.get(TYPES.BreedTypeService)
      );
    })
    .inSingletonScope();

  return container;
}

export const container = createContainer();
```

**Conceptos clave:**

- **`.bind()`**: Registra un tipo en el container
- **`.toDynamicValue()`**: Define cómo se crea la instancia
- **`.inSingletonScope()`**: Garantiza que solo se crea una instancia
- **`container.get()`**: Resuelve una dependencia del container

---

## Uso

### En Routers

**Antes:**
```typescript
const breedTypeRepository = new PostgresBreedTypeRepository(prisma);
const eventBus = getEventBus();
const breedTypeService = new BreedTypeService(breedTypeRepository, eventBus);
const breedTypeController = new BreedTypeController(breedTypeService);
```

**Después:**
```typescript
import { container } from '../../../infrastructure/di/container';
import { TYPES } from '../../../infrastructure/di/types';

const breedTypeController = container.get<BreedTypeController>(
  TYPES.BreedTypeController
);
```

### Agregar Nueva Dependencia

#### 1. Definir el símbolo en `types.ts`:

```typescript
export const TYPES = {
  // ... existentes ...
  NewService: Symbol.for('NewService'),
  NewController: Symbol.for('NewController'),
};
```

#### 2. Registrar en `container.ts`:

```typescript
// Bind Service
container
  .bind(TYPES.NewService)
  .toDynamicValue(() => {
    return new NewService(
      container.get(TYPES.SomeDependency),
      container.get(TYPES.AnotherDependency)
    );
  })
  .inSingletonScope();

// Bind Controller
container
  .bind(TYPES.NewController)
  .toDynamicValue(() => {
    return new NewController(container.get(TYPES.NewService));
  })
  .inSingletonScope();
```

#### 3. Usar en Router:

```typescript
const newController = container.get<NewController>(TYPES.NewController);
```

---

## Testing

### Unit Testing con Mocks

InversifyJS facilita enormemente el testing:

```typescript
import { Container } from 'inversify';
import { TYPES } from '../infrastructure/di/types';
import { BreedService } from './breed.service';

describe('BreedService', () => {
  let container: Container;
  let breedService: BreedService;
  let mockBreedRepository: jest.Mock;

  beforeEach(() => {
    // Crear container de test
    container = new Container();

    // Crear mock del repositorio
    mockBreedRepository = {
      findAll: jest.fn().mockResolvedValue([
        { id: '1', name: 'Labrador' },
      ]),
      save: jest.fn(),
    };

    // Registrar mock en container
    container
      .bind(TYPES.BreedRepository)
      .toConstantValue(mockBreedRepository);

    // Registrar servicio real
    container
      .bind(TYPES.BreedService)
      .toDynamicValue(() => {
        return new BreedService(
          container.get(TYPES.BreedRepository),
          container.get(TYPES.EventBus)
        );
      });

    // Resolver servicio con mock inyectado
    breedService = container.get<BreedService>(TYPES.BreedService);
  });

  it('should get all breeds', async () => {
    const breeds = await breedService.getAllBreeds();

    expect(breeds).toHaveLength(1);
    expect(breeds[0].name).toBe('Labrador');
    expect(mockBreedRepository.findAll).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
import { container } from '../infrastructure/di/container';
import { TYPES } from '../infrastructure/di/types';

describe('Breed API Integration', () => {
  it('should create breed via controller', async () => {
    const breedController = container.get<BreedController>(
      TYPES.BreedController
    );

    const req = { body: { name: 'Poodle', type: 'dog' } } as Request;
    const res = mockResponse();

    await breedController.addBreed(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

---

## Mejores Prácticas

### 1. Usa Símbolos, No Strings

**❌ Mal:**
```typescript
container.bind('BreedService').to(BreedService);
```

**✅ Bien:**
```typescript
container.bind(TYPES.BreedService).to(BreedService);
```

**Por qué:** Type safety y autocomplete.

---

### 2. Prefiere `.inSingletonScope()`

**✅ Recomendado:**
```typescript
container
  .bind(TYPES.BreedService)
  .to(BreedService)
  .inSingletonScope(); // Una sola instancia
```

**Evita `.inTransientScope()`** a menos que necesites una nueva instancia cada vez.

---

### 3. Organiza los Bindings por Categoría

```typescript
// ========== Infrastructure ==========
container.bind(TYPES.PrismaClient).toConstantValue(prisma);
container.bind(TYPES.EventBus).toConstantValue(eventBus);

// ========== Repositories ==========
container.bind(TYPES.BreedRepository)...

// ========== Services ==========
container.bind(TYPES.BreedService)...

// ========== Controllers ==========
container.bind(TYPES.BreedController)...
```

---

### 4. Usa Type Assertions

```typescript
const service = container.get(TYPES.BreedService) as BreedService;
```

O con genéricos:

```typescript
const service = container.get<BreedService>(TYPES.BreedService);
```

---

### 5. Centraliza la Configuración

**❌ No hagas esto:**
```typescript
// En múltiples archivos
const container = new Container();
container.bind(...)...
```

**✅ Haz esto:**
```typescript
// Solo en infrastructure/di/container.ts
export const container = createContainer();
```

---

## Troubleshooting

### Error: "Cannot resolve dependency"

```
Error: Cannot resolve dependency [0] of BreedService
```

**Causa:** Una dependencia no está registrada en el container.

**Solución:** Asegúrate de que todas las dependencias del constructor estén en `container.ts`:

```typescript
// Si BreedService requiere BreedRepository:
constructor(private breedRepository: IBreedRepository) {}

// Entonces debe estar en container.ts:
container.bind(TYPES.BreedRepository).to(PostgresBreedRepository);
```

---

### Error: "reflect-metadata shim is required"

```
Error: Reflect.getMetadata is not a function
```

**Causa:** `reflect-metadata` no está importado.

**Solución:** Asegúrate de que `app.ts` importa `reflect-metadata` AL INICIO:

```typescript
import 'reflect-metadata'; // DEBE ser la primera línea
import express from 'express';
// ... resto de imports
```

---

### Error: "Multiple instances created"

**Causa:** No estás usando `.inSingletonScope()`.

**Solución:**
```typescript
container
  .bind(TYPES.BreedService)
  .to(BreedService)
  .inSingletonScope(); // ← Agregar esto
```

---

### Error de TypeScript: "Type 'unknown' is not assignable"

**Causa:** `container.get()` retorna `unknown`.

**Solución:** Usa type assertion:

```typescript
const service = container.get(TYPES.BreedService) as BreedService;
// O con genéricos:
const service = container.get<BreedService>(TYPES.BreedService);
```

---

## Recursos

### Documentación Oficial

- [InversifyJS Documentation](https://inversify.io/)
- [InversifyJS GitHub](https://github.com/inversify/InversifyJS)

### Artículos Relacionados

- [npm-compare: inversify vs tsyringe vs awilix](https://npm-compare.com/awilix,inversify,tsyringe,typedi)
- [LogRocket: Top 5 TypeScript DI Containers](https://blog.logrocket.com/top-five-typescript-dependency-injection-containers/)
- [Leapcell: Dependency Injection Beyond NestJS](https://leapcell.io/blog/dependency-injection-beyond-nestjs-a-deep-dive-into-tsyringe-and-inversifyjs)

---

## Próximos Pasos

1. **Migrar más servicios**: Pet, Sponsorship, Auth
2. **Agregar decorators `@injectable()`**: Opcional, para auto-wiring
3. **Configurar múltiples containers**: Uno para prod, otro para test
4. **Implementar scopes personalizados**: Request-scoped dependencies

---

## Changelog

### 2025-01-28
- ✅ Implementación inicial de InversifyJS
- ✅ Migración de BreedService, BreedTypeService, SystemCountersService
- ✅ Configuración de container y types
- ✅ Actualización de routers
- ✅ Documentación completa
