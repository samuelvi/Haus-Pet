# Database Schema Organization for Scalability

## Overview

The HausPet database uses PostgreSQL schemas to logically separate different concerns, preparing the architecture for future physical database separation without requiring code changes.

## Schema Structure

```
hauspet_db (PostgreSQL)
├── eventstore schema
│   └── events table           # Event Store (immutable events)
│
├── readmodels schema
│   ├── animals table          # Read Model projected from events
│   └── sponsorships table     # Read Model projected from events
│
└── public schema
    ├── breed table            # CRUD operations
    ├── users table            # Authentication & user management
    └── _prisma_migrations     # Prisma migration history
```

## Rationale

### Event Store (`eventstore` schema)

**Purpose**: Stores all domain events in an append-only fashion.

**Characteristics**:
- **Immutable**: Events are never updated or deleted
- **Append-only writes**: High write throughput
- **Sequential reads**: Optimal for event replay
- **Critical data**: Source of truth for reconstructing state

**Future scalability**:
- Can be moved to a dedicated PostgreSQL instance
- Can be replaced with specialized event store (EventStoreDB)
- Can implement independent backup strategy (continuous archival)
- Can apply specific optimizations (disable autovacuum, minimal WAL)

### Read Models (`readmodels` schema)

**Purpose**: Denormalized views projected from events for query optimization.

**Characteristics**:
- **Derived data**: Can be rebuilt from events
- **Optimized for reads**: Complex queries and aggregations
- **Frequent updates**: Updated via event projections
- **Replaceable**: Can be dropped and regenerated

**Future scalability**:
- Can be moved to a separate PostgreSQL instance
- Can use read replicas for horizontal scaling
- Can implement caching layers (Redis)
- Independent from Event Store for scaling reads

### Public Schema (`public`)

**Purpose**: Traditional CRUD entities and cross-cutting concerns.

**Characteristics**:
- **Breed table**: Simple CRUD for breeds
- **Users table**: Authentication and authorization
- **Shared enums**: AnimalType, Role (used across schemas)

## Current vs Future Architecture

### Current (Phase 1): Single Database, Logical Separation

```
┌─────────────────────────────────────────┐
│       PostgreSQL (hauspet_db)           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ eventstore schema               │   │
│  │  └─ events (15 rows)            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ readmodels schema               │   │
│  │  ├─ animals (11 rows)           │   │
│  │  └─ sponsorships (2 rows)       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ public schema                   │   │
│  │  ├─ breed (13 rows)             │   │
│  │  └─ users (1 row)               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✅ ACID transactions across schemas    │
│  ✅ Simple backup/restore              │
│  ✅ No distributed transaction issues  │
└─────────────────────────────────────────┘
```

### Future (Phase 2): Physical Database Separation

```
┌─────────────────────┐   ┌──────────────────────┐
│  Event Store DB     │   │  Read Models DB      │
│  (PostgreSQL)       │   │  (PostgreSQL)        │
│                     │   │                      │
│  - events table     │   │  - animals table     │
│  - append-only      │   │  - sponsorships      │
│  - 4GB RAM, 4 CPUs  │   │  - read replicas     │
│  - continuous backup│   │  - 2GB RAM, 2 CPUs   │
└─────────────────────┘   └──────────────────────┘
          │                         ▲
          └────► Message Queue ─────┘
                 (Redis/Kafka)

Event published → Queue → Worker updates Read Models
```

## Benefits of This Approach

### 1. Evolutionary Architecture
- Start simple (single DB) but ready to scale
- Code doesn't need changes when separating DBs
- Repository pattern already isolates data access

### 2. Independent Scaling
```sql
-- Event Store optimization (when separated)
ALTER SYSTEM SET autovacuum = off;        -- No UPDATEs/DELETEs
ALTER SYSTEM SET wal_level = minimal;     -- Less overhead
ALTER SYSTEM SET shared_buffers = '512MB'; -- More cache

-- Read Models optimization (when separated)
CREATE INDEX CONCURRENTLY idx_animals_type ON readmodels.animals(type);
-- Add read replicas for query scaling
```

### 3. Backup Strategies
```bash
# Event Store: Continuous archival (critical, never lose data)
pg_basebackup --wal-method=stream eventstore_db

# Read Models: Daily backup (can be reconstructed)
pg_dump --schema=readmodels readmodels_db

# Public: Standard backup
pg_dump --schema=public app_db
```

### 4. Performance Isolation
- Heavy event replay doesn't affect API queries
- Complex read queries don't block event writes
- Independent connection pools per schema/DB

## How to Use

### Accessing Different Schemas

```typescript
// All schemas accessible through same Prisma client
import prisma from './infrastructure/database/prisma-client';

// Event Store (eventstore schema)
const events = await prisma.event.findMany({
  where: { aggregateId: 'animal-123' }
});

// Read Models (readmodels schema)
const animals = await prisma.animal.findMany();
const sponsorships = await prisma.sponsorship.findMany();

// Public schema
const breeds = await prisma.breed.findMany();
const users = await prisma.user.findMany();
```

### Future: Factory Pattern for DB Separation

When you separate databases, use a factory:

```typescript
// infrastructure/database/database.factory.ts
export class DatabaseFactory {
  private static eventStoreClient: PrismaClient;
  private static readModelsClient: PrismaClient;
  private static publicClient: PrismaClient;

  static getEventStoreClient(): PrismaClient {
    if (!this.eventStoreClient) {
      this.eventStoreClient = new PrismaClient({
        datasources: {
          db: { url: process.env.EVENTSTORE_DB_URL }
        }
      });
    }
    return this.eventStoreClient;
  }

  // Similar for readModels and public...
}
```

## Migration Applied

The schema organization was applied with the following SQL:

```sql
-- Create schemas
CREATE SCHEMA IF NOT EXISTS eventstore;
CREATE SCHEMA IF NOT EXISTS readmodels;

-- Move tables (preserves all data and indexes)
ALTER TABLE public.events SET SCHEMA eventstore;
ALTER TABLE public.animals SET SCHEMA readmodels;
ALTER TABLE public.sponsorships SET SCHEMA readmodels;
```

**No data was lost**. The `ALTER TABLE ... SET SCHEMA` command moves tables with all data, indexes, and constraints intact.

## Verification

```sql
-- Check schema organization
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname IN ('public', 'eventstore', 'readmodels')
ORDER BY schemaname, tablename;

-- Result:
-- eventstore | events
-- public     | breed
-- public     | users
-- readmodels | animals
-- readmodels | sponsorships
```

## Next Steps for Scaling

### When to Separate Databases

Separate when you reach these thresholds:

1. **Event Store** → Separate DB when:
   - > 10,000 events/day
   - > 1 million total events
   - Event replay impacts API performance

2. **Read Models** → Separate DB when:
   - Query latency > 200ms
   - Need read replicas for scaling
   - Want independent caching strategy

### Implementation Steps

1. Set up new PostgreSQL instances
2. Export schema-specific data
3. Update environment variables (EVENTSTORE_DB_URL, etc.)
4. Implement message queue for eventual consistency
5. Use Saga pattern for distributed transactions
6. Update factory to use separate clients

## Monitoring

Monitor schema-level metrics to inform separation decisions:

```sql
-- Query performance by schema
SELECT schemaname, COUNT(*) as query_count, AVG(total_time) as avg_time_ms
FROM pg_stat_statements
JOIN pg_tables ON query LIKE '%' || tablename || '%'
WHERE schemaname IN ('eventstore', 'readmodels', 'public')
GROUP BY schemaname;

-- Table sizes by schema
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname IN ('eventstore', 'readmodels', 'public')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## References

- [PostgreSQL Multi-Schema Best Practices](https://www.postgresql.org/docs/current/ddl-schemas.html)
- [Event Sourcing Architecture](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Prisma Multi-Schema Support](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema)
