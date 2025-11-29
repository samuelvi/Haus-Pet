# Sistema de Contadores del Sistema (System Counters)

## Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Componentes](#componentes)
4. [Flujo de Datos](#flujo-de-datos)
5. [API](#api)
6. [Base de Datos](#base-de-datos)
7. [Frontend](#frontend)
8. [Extensibilidad](#extensibilidad)
9. [Mantenimiento](#mantenimiento)

---

## Visión General

El **Sistema de Contadores** es una implementación de contadores precalculados que rastrea métricas clave del sistema HausPet en tiempo real. En lugar de calcular los totales cada vez que se consultan (lo cual sería costoso en términos de rendimiento), los contadores se mantienen actualizados mediante una **arquitectura dirigida por eventos** (Event-Driven Architecture).

### Características Principales

- ✅ **Contadores Precalculados**: Los valores se calculan una vez y se actualizan incrementalmente
- ✅ **Arquitectura Dirigida por Eventos**: Uso de Domain Events para mantener consistencia
- ✅ **Un Solo Endpoint API**: `/api/admin/counters` devuelve todos los contadores en una llamada
- ✅ **Securizado**: Requiere autenticación y rol ADMIN
- ✅ **Genérico y Extensible**: Fácil de agregar nuevos contadores
- ✅ **Separación de Concerns**: Los contadores viven en su propia tabla

### Contadores Implementados

| Contador | Descripción |
|----------|-------------|
| `totalBreeds` | Total de razas (breeds) en el sistema |
| `totalBreedTypes` | Total de tipos de razas (dog, cat, bird, etc.) |
| `totalActivePets` | Total de mascotas activas |
| `totalSponsorships` | Total de patrocinios |
| `totalUsers` | Total de usuarios registrados |
| `totalRevenue` | Ingresos totales por patrocinios (USD) |

---

## Arquitectura

El sistema sigue los principios de **Domain-Driven Design (DDD)** y **Event-Driven Architecture (EDA)**:

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│  Breed Service  │─────▶│    Event Bus     │─────▶│ Counter Handler │
│                 │      │  (In-Memory)     │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                                                      │
        │ 1. Create Breed                                     │ 3. Update Counter
        ▼                                                      ▼
┌─────────────────┐      2. Emit BreedCreatedEvent   ┌─────────────────┐
│   Breed Table   │                                   │SystemCounters   │
│   (Public)      │                                   │    Table        │
└─────────────────┘                                   └─────────────────┘
```

### Capas de la Arquitectura

1. **Domain Layer**: Entidades, eventos de dominio, interfaces de repositorio
2. **Application Layer**: Servicios de negocio, event handlers
3. **Infrastructure Layer**: Implementaciones de repositorios, Event Bus, controladores HTTP
4. **Presentation Layer**: Frontend React que consume la API

---

## Componentes

### 1. Domain Layer

#### `SystemCounters` Entity (`domain/counters/SystemCounters.ts`)

Entidad inmutable que representa los contadores del sistema. Usa el patrón **Value Object** donde cada modificación retorna una nueva instancia:

```typescript
export class SystemCounters {
  private constructor(
    public readonly id: string,
    public readonly totalBreeds: number,
    public readonly totalActivePets: number,
    public readonly totalBreedTypes: number,
    public readonly totalSponsorships: number,
    public readonly totalUsers: number,
    public readonly totalRevenue: number,
    public readonly updatedAt: Date
  ) {}

  // Métodos inmutables que retornan nueva instancia
  incrementBreeds(amount: number = 1): SystemCounters { ... }
  decrementBreeds(amount: number = 1): SystemCounters { ... }
  incrementPets(amount: number = 1): SystemCounters { ... }
  // ... otros métodos
}
```

**Características**:
- Inmutable (patrón functional)
- Constructor privado
- Métodos factory: `create()` y `reconstitute()`
- Validaciones en cada operación
- Método `toDTO()` para serialización

#### `ISystemCountersRepository` (`domain/counters/ISystemCountersRepository.ts`)

Interfaz del repositorio siguiendo el patrón **Repository**:

```typescript
export interface ISystemCountersRepository {
  get(): Promise<SystemCounters>;
  update(counters: SystemCounters): Promise<void>;
  initialize(): Promise<void>;
}
```

#### Domain Events (`domain/events/DomainEvent.ts`)

Eventos de dominio que representan hechos significativos en el sistema:

```typescript
// Evento base
interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly payload: Record<string, any>;
}

// Eventos implementados
class BreedCreatedEvent implements DomainEvent
class BreedDeletedEvent implements DomainEvent
class BreedTypeCreatedEvent implements DomainEvent
class BreedTypeDeletedEvent implements DomainEvent
class PetCreatedEvent implements DomainEvent
class PetDeletedEvent implements DomainEvent
class SponsorshipCreatedEvent implements DomainEvent
class UserRegisteredEvent implements DomainEvent
```

### 2. Application Layer

#### `SystemCountersService` (`application/SystemCountersService.ts`)

Servicio de aplicación que orquesta la lógica de negocio:

```typescript
export class SystemCountersService {
  constructor(
    private readonly systemCountersRepository: ISystemCountersRepository
  ) {}

  async getCounters(): Promise<SystemCountersDTO> { ... }
  async incrementBreeds(amount: number = 1): Promise<void> { ... }
  async decrementBreeds(amount: number = 1): Promise<void> { ... }
  async incrementPets(amount: number = 1): Promise<void> { ... }
  // ... otros métodos
  async recalculate(): Promise<void> { ... }
}
```

**Método `recalculate()`**: Útil para:
- Inicialización del sistema
- Reparar inconsistencias
- Debugging

#### Event Handlers (`application/event-handlers/CounterEventHandlers.ts`)

Handlers que escuchan eventos y actualizan contadores:

```typescript
export class BreedCreatedHandler implements IEventHandler<BreedCreatedEvent> {
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: BreedCreatedEvent): Promise<void> {
    await this.countersService.incrementBreeds();
  }
}

export class BreedDeletedHandler implements IEventHandler<BreedDeletedEvent> {
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: BreedDeletedEvent): Promise<void> {
    await this.countersService.decrementBreeds();
  }
}

// ... 6 handlers más para los otros eventos
```

### 3. Infrastructure Layer

#### `EventBus` (`infrastructure/events/EventBus.ts`)

Sistema de eventos in-memory con soporte opcional para BullMQ:

```typescript
export class EventBus {
  private handlers: Map<string, IEventHandler[]> = new Map();

  register<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>
  ): void { ... }

  async publish(event: DomainEvent): Promise<void> {
    // Procesamiento síncrono para contadores
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map(h => h.handle(event)));

    // Opcionalmente encolar para procesamiento asíncrono
    if (this.queue) {
      await this.queue.add('domain-event', event);
    }
  }
}

// Singleton
let eventBusInstance: EventBus | null = null;
export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(false); // false = no usar cola
  }
  return eventBusInstance;
}
```

**Características**:
- Procesamiento síncrono por defecto (para consistencia)
- Soporte para múltiples handlers por evento
- Opcional: encolar eventos en BullMQ para procesamiento asíncrono
- Patrón Singleton

#### `setupEventHandlers` (`infrastructure/events/setupEventHandlers.ts`)

Función de inicialización que registra todos los handlers:

```typescript
export function setupEventHandlers(
  eventBus: EventBus,
  countersService: SystemCountersService
): void {
  eventBus.register('BreedCreated', new BreedCreatedHandler(countersService));
  eventBus.register('BreedDeleted', new BreedDeletedHandler(countersService));
  eventBus.register('BreedTypeCreated', new BreedTypeCreatedHandler(countersService));
  eventBus.register('BreedTypeDeleted', new BreedTypeDeletedHandler(countersService));
  eventBus.register('PetCreated', new PetCreatedHandler(countersService));
  eventBus.register('PetDeleted', new PetDeletedHandler(countersService));
  eventBus.register('SponsorshipCreated', new SponsorshipCreatedHandler(countersService));
  eventBus.register('UserRegistered', new UserRegisteredHandler(countersService));

  console.log('✅ Event handlers registered');
}
```

Esta función se llama en `app.ts` durante el inicio de la aplicación.

#### `PrismaSystemCountersRepository` (`infrastructure/persistence/PrismaSystemCountersRepository.ts`)

Implementación del repositorio usando Prisma:

```typescript
export class PrismaSystemCountersRepository implements ISystemCountersRepository {
  private static readonly SYSTEM_ID = 'system';

  constructor(private readonly prisma: PrismaClient) {}

  async get(): Promise<SystemCounters> {
    // Crea la fila si no existe (patrón Singleton en DB)
    const record = await this.prisma.systemCounters.upsert({
      where: { id: PrismaSystemCountersRepository.SYSTEM_ID },
      update: {},
      create: {
        id: PrismaSystemCountersRepository.SYSTEM_ID,
        // ... valores por defecto
      },
    });

    return SystemCounters.reconstitute({ ... });
  }

  async update(counters: SystemCounters): Promise<void> {
    const dto = counters.toDTO();
    await this.prisma.systemCounters.upsert({
      where: { id: dto.id },
      update: { ... },
      create: { ... },
    });
  }

  async initialize(): Promise<void> {
    // Recalcula desde cero usando aggregates
    const [breedsCount, petsCount, breedTypesCount, ...] = await Promise.all([
      this.prisma.breed.count(),
      this.prisma.pet.count(),
      this.prisma.breedType.count(),
      // ...
    ]);

    await this.prisma.systemCounters.upsert({ ... });
  }
}
```

**Características**:
- Patrón Singleton en base de datos (un solo registro con ID fijo "system")
- Usa `upsert` para crear o actualizar
- Método `initialize()` calcula desde cero

#### `SystemCountersController` (`infrastructure/http/controllers/system-counters.controller.ts`)

Controlador HTTP que maneja requests:

```typescript
export class SystemCountersController {
  constructor(private readonly countersService: SystemCountersService) {}

  async getCounters(req: Request, res: Response): Promise<void> {
    try {
      const counters = await this.countersService.getCounters();
      res.status(200).json({ status: 'OK', data: counters });
    } catch (error) {
      console.error('Error fetching system counters:', error);
      res.status(500).json({
        status: 'ERROR',
        message: 'Failed to fetch system counters',
      });
    }
  }

  async recalculate(req: Request, res: Response): Promise<void> {
    // Recalcula y devuelve nuevos valores
  }
}
```

#### Router (`routes/api/admin/system-counters.router.ts`)

Define las rutas HTTP protegidas:

```typescript
export function createSystemCountersRouter(
  controller: SystemCountersController
): Router {
  const router = Router();

  // Middleware de autenticación
  const jwtService = new JwtService();
  const sessionService = new SessionService();
  const authMiddleware = createAuthMiddleware(jwtService, sessionService);

  // Middleware de autorización (solo ADMIN)
  const requireAdmin = (req, res, next) => { ... };

  router.get('/', authMiddleware, requireAdmin,
    (req, res) => controller.getCounters(req, res));

  router.post('/recalculate', authMiddleware, requireAdmin,
    (req, res) => controller.recalculate(req, res));

  return router;
}
```

### 4. Integración con Servicios Existentes

#### `BreedService` Modificado

```typescript
export class BreedService {
  constructor(
    private readonly breedReadRepository: BreedReadRepository,
    private readonly breedWriteRepository: BreedWriteRepository,
    private readonly breedTypeRepository: BreedTypeRepository,
    private readonly eventBus: EventBus // ← NUEVO
  ) {}

  public async addBreed(name: string, petType: PetType): Promise<Breed> {
    // ... lógica de creación ...
    const savedBreed = await this.breedWriteRepository.save(newBreed);

    // Emitir evento de dominio
    await this.eventBus.publish(
      new BreedCreatedEvent({
        breedId: savedBreed.id!,
        name: savedBreed.name,
        breedTypeId: savedBreed.breedTypeId!,
      })
    );

    return savedBreed;
  }

  public async deleteBreed(id: string): Promise<void> {
    await this.breedWriteRepository.delete(id);

    // Emitir evento
    await this.eventBus.publish(new BreedDeletedEvent({ breedId: id }));
  }
}
```

**Puntos clave**:
- EventBus se inyecta en el constructor
- Eventos se emiten DESPUÉS de operaciones exitosas
- No se afecta el flujo normal si el event bus falla (fail-safe)

---

## Flujo de Datos

### Ejemplo: Creación de una Nueva Raza

```
1. Usuario (ADMIN) hace POST /api/breeds/add
   │
   ▼
2. BreedController recibe request
   │
   ▼
3. BreedService.addBreed()
   │
   ├─▶ Valida datos
   │
   ├─▶ Guarda en DB (tabla breed)
   │
   └─▶ Publica BreedCreatedEvent
       │
       ▼
4. EventBus.publish()
   │
   ├─▶ Encuentra handlers registrados para 'BreedCreated'
   │
   └─▶ Llama a BreedCreatedHandler.handle()
       │
       ▼
5. BreedCreatedHandler
   │
   └─▶ countersService.incrementBreeds()
       │
       ▼
6. SystemCountersService
   │
   ├─▶ repository.get() → obtiene SystemCounters actual
   │
   ├─▶ counters.incrementBreeds() → crea nueva instancia con +1
   │
   └─▶ repository.update() → guarda en DB (tabla system_counters)
       │
       ▼
7. ✅ Contador actualizado en DB
   │
   ▼
8. Response al usuario: breed creada exitosamente
```

### Ejemplo: Consulta de Contadores desde el Dashboard

```
1. Usuario se loguea y abre Dashboard
   │
   ▼
2. React useEffect() se ejecuta
   │
   ▼
3. CountersService.getCounters() hace GET /api/admin/counters
   │
   ▼
4. API verifica autenticación y rol ADMIN
   │
   ▼
5. SystemCountersController.getCounters()
   │
   └─▶ SystemCountersService.getCounters()
       │
       └─▶ repository.get()
           │
           ▼
6. SELECT FROM system_counters WHERE id = 'system'
   │
   ▼
7. Retorna SystemCounters entity
   │
   ▼
8. Convierte a DTO y serializa como JSON
   │
   ▼
9. Response:
   {
     "status": "OK",
     "data": {
       "id": "system",
       "totalBreeds": 13,
       "totalActivePets": 0,
       "totalBreedTypes": 3,
       "totalSponsorships": 0,
       "totalUsers": 1,
       "totalRevenue": "0.00",
       "updatedAt": "2025-11-28T14:06:55.000Z"
     }
   }
   │
   ▼
10. React actualiza estado y renderiza valores
```

---

## API

### Endpoints

#### `GET /api/admin/counters`

Obtiene todos los contadores del sistema.

**Autenticación**: Requerida (JWT)
**Autorización**: Solo rol `ADMIN`

**Response 200 OK**:
```json
{
  "status": "OK",
  "data": {
    "id": "system",
    "totalBreeds": 13,
    "totalActivePets": 5,
    "totalBreedTypes": 3,
    "totalSponsorships": 10,
    "totalUsers": 25,
    "totalRevenue": "1500.00",
    "updatedAt": "2025-11-28T14:06:55.000Z"
  }
}
```

**Response 401 Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

**Response 403 Forbidden**:
```json
{
  "error": "Admin access required"
}
```

**Response 500 Internal Server Error**:
```json
{
  "status": "ERROR",
  "message": "Failed to fetch system counters"
}
```

#### `POST /api/admin/counters/recalculate`

Recalcula todos los contadores desde cero.

**Autenticación**: Requerida (JWT)
**Autorización**: Solo rol `ADMIN`

**Response 200 OK**:
```json
{
  "status": "OK",
  "message": "Counters recalculated successfully",
  "data": {
    "id": "system",
    "totalBreeds": 13,
    ...
  }
}
```

**Uso**: Este endpoint es útil para:
- Reparar inconsistencias si los eventos fallaron
- Debugging y verificación
- Después de migraciones de datos

---

## Base de Datos

### Tabla `system_counters`

Esquema Prisma:

```prisma
model SystemCounters {
  id                String   @id @default("system")
  totalBreeds       Int      @default(0) @map("total_breeds")
  totalActivePets   Int      @default(0) @map("total_active_pets")
  totalBreedTypes   Int      @default(0) @map("total_breed_types")
  totalSponsorships Int      @default(0) @map("total_sponsorships")
  totalUsers        Int      @default(0) @map("total_users")
  totalRevenue      Decimal  @default(0) @map("total_revenue") @db.Decimal(10, 2)
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("system_counters")
  @@schema("public")
}
```

**Características**:
- **ID fijo**: `"system"` (un solo registro, patrón Singleton)
- **Schema**: `public` (no en eventstore ni readmodels)
- **updatedAt**: Timestamp automático en cada actualización
- **totalRevenue**: Decimal(10,2) para precisión monetaria

### Migración

Archivo: `prisma/migrations/20251128140655_add_system_counters/migration.sql`

```sql
-- CreateTable
CREATE TABLE "system_counters" (
    "id" TEXT NOT NULL,
    "total_breeds" INTEGER NOT NULL DEFAULT 0,
    "total_active_pets" INTEGER NOT NULL DEFAULT 0,
    "total_breed_types" INTEGER NOT NULL DEFAULT 0,
    "total_sponsorships" INTEGER NOT NULL DEFAULT 0,
    "total_users" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_counters_pkey" PRIMARY KEY ("id")
);
```

### Inicialización (Seed)

El archivo `prisma/seed.ts` inicializa los contadores:

```typescript
// ... crear breeds, breed types, etc ...

// Inicializar contadores del sistema
const totalBreeds = await prisma.breed.count();
const totalBreedTypes = await prisma.breedType.count();
const totalActivePets = await prisma.pet.count();
const totalSponsorships = await prisma.sponsorship.count();
const totalUsers = await prisma.user.count();
const totalRevenue = await prisma.sponsorship.aggregate({
  _sum: { amount: true },
});

await prisma.systemCounters.upsert({
  where: { id: 'system' },
  update: {
    totalBreeds,
    totalBreedTypes,
    totalActivePets,
    totalSponsorships,
    totalUsers,
    totalRevenue: totalRevenue._sum.amount || 0,
  },
  create: {
    id: 'system',
    totalBreeds,
    totalBreedTypes,
    totalActivePets,
    totalSponsorships,
    totalUsers,
    totalRevenue: totalRevenue._sum.amount || 0,
  },
});

console.log(`System counters initialized:`);
console.log(`  - Total Breeds: ${totalBreeds}`);
console.log(`  - Total Breed Types: ${totalBreedTypes}`);
// ...
```

---

## Frontend

### Service (`frontend/src/services/counters.service.ts`)

```typescript
export interface SystemCounters {
  id: string;
  totalBreeds: number;
  totalActivePets: number;
  totalBreedTypes: number;
  totalSponsorships: number;
  totalUsers: number;
  totalRevenue: number;
  updatedAt: string;
}

export class CountersService {
  static async getCounters(): Promise<SystemCounters> {
    const response = await apiClient.get<SystemCounters>('/admin/counters');
    return response;
  }
}
```

### Dashboard Component (`frontend/src/components/Dashboard.tsx`)

```typescript
export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [counters, setCounters] = useState<SystemCounters | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const data = await CountersService.getCounters();
        setCounters(data);
      } catch (error) {
        console.error('Error fetching counters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounters();
  }, []);

  return (
    <div>
      {/* ... */}
      <div className="stats-card">
        <p className="text-2xl font-bold">
          {loading ? '-' : counters?.totalBreeds ?? 0}
        </p>
      </div>
      {/* ... más stats ... */}
    </div>
  );
};
```

**Características**:
- Fetch en `useEffect` al montar el componente
- Estado de loading mientras carga
- Fallback a `-` si está cargando o `0` si no hay datos

---

## Extensibilidad

### Agregar un Nuevo Contador

Para agregar un nuevo contador (ejemplo: `totalAdoptions`):

#### 1. Actualizar el Schema de Prisma

```prisma
model SystemCounters {
  // ... campos existentes ...
  totalAdoptions    Int      @default(0) @map("total_adoptions") // NUEVO

  @@map("system_counters")
  @@schema("public")
}
```

Generar migración:
```bash
npx prisma migrate dev --name add_total_adoptions
```

#### 2. Actualizar la Entidad `SystemCounters`

```typescript
export class SystemCounters {
  constructor(
    // ... propiedades existentes ...
    public readonly totalAdoptions: number, // NUEVO
  ) {}

  // Agregar métodos
  incrementAdoptions(amount: number = 1): SystemCounters {
    return new SystemCounters(
      this.id,
      this.totalBreeds,
      this.totalActivePets,
      this.totalBreedTypes,
      this.totalSponsorships,
      this.totalUsers,
      this.totalRevenue,
      this.totalAdoptions + amount, // NUEVO
      new Date()
    );
  }

  decrementAdoptions(amount: number = 1): SystemCounters {
    const newTotal = Math.max(0, this.totalAdoptions - amount);
    return new SystemCounters(
      // ... mismo patrón ...
      newTotal,
      new Date()
    );
  }
}
```

#### 3. Crear Eventos de Dominio

```typescript
export class AdoptionCreatedEvent implements DomainEvent {
  readonly eventType = 'AdoptionCreated';
  readonly occurredAt: Date;

  constructor(
    public readonly payload: {
      adoptionId: string;
      petId: string;
      userId: string;
    }
  ) {
    this.occurredAt = new Date();
  }
}
```

#### 4. Crear Event Handler

```typescript
export class AdoptionCreatedHandler implements IEventHandler<AdoptionCreatedEvent> {
  constructor(private readonly countersService: SystemCountersService) {}

  async handle(event: AdoptionCreatedEvent): Promise<void> {
    await this.countersService.incrementAdoptions();
  }
}
```

#### 5. Registrar Handler en `setupEventHandlers`

```typescript
export function setupEventHandlers(
  eventBus: EventBus,
  countersService: SystemCountersService
): void {
  // ... handlers existentes ...

  eventBus.register('AdoptionCreated', new AdoptionCreatedHandler(countersService)); // NUEVO

  console.log('✅ Event handlers registered');
}
```

#### 6. Actualizar el Servicio

```typescript
export class SystemCountersService {
  // Agregar métodos
  async incrementAdoptions(amount: number = 1): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.incrementAdoptions(amount);
    await this.systemCountersRepository.update(updated);
  }

  async decrementAdoptions(amount: number = 1): Promise<void> {
    const counters = await this.systemCountersRepository.get();
    const updated = counters.decrementAdoptions(amount);
    await this.systemCountersRepository.update(updated);
  }
}
```

#### 7. Emitir Eventos desde AdoptionService

```typescript
export class AdoptionService {
  constructor(
    private readonly adoptionRepository: IAdoptionRepository,
    private readonly eventBus: EventBus // Inyectar EventBus
  ) {}

  async createAdoption(data: CreateAdoptionDTO): Promise<Adoption> {
    const adoption = await this.adoptionRepository.create(data);

    // Emitir evento
    await this.eventBus.publish(
      new AdoptionCreatedEvent({
        adoptionId: adoption.id,
        petId: adoption.petId,
        userId: adoption.userId,
      })
    );

    return adoption;
  }
}
```

#### 8. Actualizar Frontend

```typescript
// counters.service.ts
export interface SystemCounters {
  // ... campos existentes ...
  totalAdoptions: number; // NUEVO
}

// Dashboard.tsx
<div className="stats-card">
  <p className="text-sm">Total Adoptions</p>
  <p className="text-2xl font-bold">
    {loading ? '-' : counters?.totalAdoptions ?? 0}
  </p>
</div>
```

---

## Mantenimiento

### Debugging

#### Ver Eventos Registrados

```typescript
import { getEventBus } from './infrastructure/events/EventBus';

const eventBus = getEventBus();
console.log('Registered events:', eventBus.getRegisteredEventTypes());
// Output: ['BreedCreated', 'BreedDeleted', 'BreedTypeCreated', ...]
```

#### Verificar Contadores

```bash
# Desde psql
psql -U user -d hauspet_db

SELECT * FROM system_counters;
```

#### Recalcular Manualmente

```bash
# Via API
curl -X POST http://localhost:3000/api/admin/counters/recalculate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Ver Logs de Eventos

El EventBus puede extenderse para logging:

```typescript
async publish(event: DomainEvent): Promise<void> {
  console.log(`📣 Publishing event: ${event.eventType}`, event.payload);

  const handlers = this.handlers.get(event.eventType) || [];
  console.log(`  ➡️ ${handlers.length} handler(s) registered`);

  await Promise.all(
    handlers.map(async (handler) => {
      try {
        await handler.handle(event);
        console.log(`  ✅ Handler executed successfully`);
      } catch (error) {
        console.error(`  ❌ Handler failed:`, error);
        throw error;
      }
    })
  );
}
```

### Testing

#### Unit Tests para SystemCounters Entity

```typescript
describe('SystemCounters', () => {
  it('should increment breeds correctly', () => {
    const counters = SystemCounters.create({
      totalBreeds: 10,
      // ... otros campos ...
    });

    const updated = counters.incrementBreeds(5);

    expect(updated.totalBreeds).toBe(15);
    expect(updated).not.toBe(counters); // Inmutable
  });

  it('should not allow negative values', () => {
    const counters = SystemCounters.create({ totalBreeds: 2 });
    const updated = counters.decrementBreeds(5);

    expect(updated.totalBreeds).toBe(0); // No negativo
  });
});
```

#### Integration Tests para Event Flow

```typescript
describe('Breed Creation Event Flow', () => {
  it('should increment counter when breed is created', async () => {
    // Arrange
    const eventBus = new EventBus();
    const repository = new MockSystemCountersRepository();
    const service = new SystemCountersService(repository);
    setupEventHandlers(eventBus, service);

    // Act
    await eventBus.publish(
      new BreedCreatedEvent({
        breedId: 'test-id',
        name: 'Test Breed',
        breedTypeId: 'type-dog',
      })
    );

    // Assert
    const counters = await repository.get();
    expect(counters.totalBreeds).toBe(1);
  });
});
```

### Performance

#### Índices en Base de Datos

No se requieren índices adicionales para `system_counters` ya que:
- Solo hay un registro (ID fijo "system")
- La clave primaria ya tiene índice
- Todas las consultas son por ID

#### Optimizaciones

1. **Procesamiento Síncrono**: Los contadores se actualizan síncronamente para garantizar consistencia
2. **Upsert**: Usa `upsert` para atomicidad
3. **Transacciones**: Prisma usa transacciones implícitas en `upsert`

Si el volumen de eventos es muy alto, considerar:
- Usar BullMQ para procesamiento asíncrono
- Batch updates (acumular eventos y actualizar en lotes)
- Read replicas para consultas

### Backup y Recovery

#### Backup de Contadores

```bash
# Dump solo la tabla system_counters
pg_dump -U user -d hauspet_db -t system_counters > counters_backup.sql
```

#### Recovery tras Inconsistencia

```bash
# Via API
curl -X POST http://localhost:3000/api/admin/counters/recalculate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

O directamente en base de datos:

```sql
-- Recalcular totales
UPDATE system_counters SET
  total_breeds = (SELECT COUNT(*) FROM breed),
  total_breed_types = (SELECT COUNT(*) FROM breed_types),
  total_active_pets = (SELECT COUNT(*) FROM pets WHERE status = 'active'),
  total_sponsorships = (SELECT COUNT(*) FROM sponsorships),
  total_users = (SELECT COUNT(*) FROM users),
  total_revenue = (SELECT COALESCE(SUM(amount), 0) FROM sponsorships),
  updated_at = NOW()
WHERE id = 'system';
```

---

## Conclusión

El Sistema de Contadores implementado en HausPet es un ejemplo robusto de arquitectura dirigida por eventos que combina:

✅ **Precálculo eficiente**: Los contadores se mantienen actualizados incrementalmente
✅ **Separación de concerns**: Contadores en tabla dedicada, no mezclados con datos de negocio
✅ **Extensibilidad**: Fácil agregar nuevos contadores siguiendo el mismo patrón
✅ **Consistencia**: Eventos síncronos garantizan que los contadores estén actualizados
✅ **Mantenibilidad**: Endpoint de recalculación permite reparar inconsistencias
✅ **Escalabilidad**: Puede evolucionar a procesamiento asíncrono si es necesario

Este sistema es un componente crítico para el Dashboard administrativo y proporciona métricas en tiempo real con rendimiento óptimo.
