# Fuzzy Search Implementation

## Overview

This project implements **database-agnostic fuzzy search** using [Fuse.js](https://fusejs.io/) at the application layer. This approach works with **any database** (PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, etc.) without requiring database-specific extensions or syntax.

## Why Application-Level Fuzzy Search?

### Advantages:
- ✅ **Database Agnostic**: Works with PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, SQLite, MongoDB
- ✅ **Consistent Behavior**: Same search quality across all databases
- ✅ **No Extensions Required**: No need to install pg_trgm, Full-Text Search, or other DB extensions
- ✅ **Easy to Configure**: Single configuration point for fuzzy matching parameters
- ✅ **Portable**: Can switch databases without changing search logic

### Trade-offs:
- ⚠️ **Memory Usage**: Loads filtered results into memory before fuzzy matching
- ⚠️ **Not Suitable for Large Datasets**: For millions of records, consider database-level solutions

## How It Works

### Architecture Flow:

```
Client Request
    ↓
Controller extracts filters (type + search term)
    ↓
Service Layer (pet.service.ts)
    ↓
├─→ Database filter by TYPE only ────→ PetRepository (Prisma)
│                                           ↓
│                                      Returns filtered pets
│                                           ↓
└─→ Application-level fuzzy search ─→ FuzzySearchService (Fuse.js)
                                           ↓
                                      Returns fuzzy-matched pets
```

### Code Example:

```typescript
// src/application/pet.service.ts
public async getAllPets(filters?: PetFilters): Promise<Pet[]> {
  // Step 1: Filter by type at database level (efficient)
  const dbFilters: PetFilters = {};
  if (filters?.type) {
    dbFilters.type = filters.type;
  }

  let pets = await this.petReadRepository.findAll(dbFilters);

  // Step 2: Apply fuzzy search at application level (tolerates typos)
  if (filters?.search) {
    pets = this.fuzzySearchService.searchPets(pets, filters.search);
  }

  return pets;
}
```

## Fuzzy Search Configuration

The fuzzy search service uses Fuse.js with the following configuration:

```typescript
// src/application/fuzzy-search.service.ts
const fuse = new Fuse(pets, {
  keys: ['breed'],           // Search in breed field
  threshold: 0.4,            // 0.0 = exact match, 1.0 = match anything
  distance: 100,             // Maximum distance to search
  ignoreLocation: true,      // Don't consider position of match
});
```

### Threshold Explained:

- `0.0`: Exact match required (no typos)
- `0.2`: Very strict (1 typo in 10 characters)
- `0.4`: **Default** - Good balance (handles common typos)
- `0.6`: Lenient (more false positives)
- `1.0`: Matches everything

### Examples with Default Threshold (0.4):

| Search Term | Matches | Explanation |
|------------|---------|-------------|
| `bengla` | Bengal, Beagle | 1 transposed character |
| `siamse` | Siamese | 1 missing character |
| `retrever` | Golden Retriever | Substring match with typo |
| `lab` | Labrador | Partial match |
| `persian` | Persian | Exact match |

## Database-Specific Alternatives

If you need database-level fuzzy search for performance reasons:

### PostgreSQL (pg_trgm)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT * FROM "Pet"
WHERE similarity(breed, 'bengla') > 0.3
ORDER BY similarity(breed, 'bengla') DESC;
```

**Prisma raw query:**
```typescript
const pets = await prisma.$queryRaw`
  SELECT * FROM "Pet"
  WHERE similarity(breed, ${searchTerm}) > 0.3
  ORDER BY similarity(breed, ${searchTerm}) DESC
`;
```

### MySQL/MariaDB (SOUNDEX)

```sql
SELECT * FROM Pet
WHERE SOUNDEX(breed) = SOUNDEX('bengal');
```

**Limitations**: Only works for phonetically similar words, not typos.

### SQL Server (SOUNDEX + DIFFERENCE)

```sql
SELECT * FROM Pet
WHERE DIFFERENCE(breed, 'bengal') >= 3;
```

### Oracle (UTL_MATCH.EDIT_DISTANCE)

```sql
SELECT * FROM Pet
WHERE UTL_MATCH.EDIT_DISTANCE(breed, 'bengal') <= 2;
```

## Performance Considerations

### Current Implementation (Application-Level):

**Good for:**
- Small to medium datasets (< 10,000 records)
- When you need database portability
- Development and testing environments

**Not ideal for:**
- Very large datasets (> 100,000 records)
- High-frequency search operations

### Optimization Strategies:

1. **Combine with Database Filters**: Always filter by type/category at database level first
   ```typescript
   // Good: Reduces result set before fuzzy search
   const dbFilters = { type: 'cat' };
   let pets = await repository.findAll(dbFilters);
   pets = fuzzySearch.search(pets, 'bengla');

   // Bad: Loads all records into memory
   let pets = await repository.findAll();
   pets = fuzzySearch.search(pets, 'bengla');
   ```

2. **Add Pagination**: Limit results before fuzzy search
   ```typescript
   const dbFilters = { type: 'cat', limit: 100, offset: 0 };
   ```

3. **Caching**: Cache frequently searched terms
   ```typescript
   const cacheKey = `search:${type}:${searchTerm}`;
   const cached = cache.get(cacheKey);
   if (cached) return cached;
   ```

4. **Switch to Database-Level for Scale**: If dataset grows > 50,000 records, implement database-specific fuzzy search

## Migration Path to Database-Level Search

If you need to migrate to database-level fuzzy search later:

1. Create a new repository implementation (e.g., `PostgresFuzzyPetRepository`)
2. Implement database-specific fuzzy search in `findAll()`
3. Update dependency injection to use new repository
4. Application code remains unchanged (follows repository pattern)

```typescript
// Example: PostgreSQL with pg_trgm
class PostgresFuzzyPetRepository implements PetReadRepository {
  async findAll(filters?: PetFilters): Promise<Pet[]> {
    if (filters?.search) {
      return this.prisma.$queryRaw`
        SELECT * FROM "Pet"
        WHERE (${!filters.type} OR type = ${filters.type})
        AND similarity(breed, ${filters.search}) > 0.3
        ORDER BY similarity(breed, ${filters.search}) DESC
      `;
    }
    // ... normal query
  }
}
```

## Testing Fuzzy Search

### API Examples:

```bash
# Typo: "bengla" instead of "Bengal"
curl "http://localhost:3000/api/pets?search=bengla"
# Returns: Bengal, Beagle

# Typo: "siamse" instead of "Siamese"
curl "http://localhost:3000/api/pets?search=siamse"
# Returns: Siamese

# Typo: "retrever" instead of "Retriever"
curl "http://localhost:3000/api/pets?search=retrever"
# Returns: Golden Retriever

# Combined filters
curl "http://localhost:3000/api/pets?type=cat&search=bengla"
# Returns: Bengal (filtered by type first)
```

### Frontend Testing:

1. Navigate to the pets list
2. Select a pet type (optional)
3. Type a breed name with intentional typos
4. Click "Listar" button
5. Verify results include fuzzy-matched breeds

## Configuration Tuning

To adjust fuzzy search sensitivity, edit `src/application/fuzzy-search.service.ts`:

```typescript
// More strict (fewer false positives)
threshold: 0.2

// More lenient (more results, more false positives)
threshold: 0.6
```

## Conclusion

The current implementation provides:
- ✅ Database portability (works with any SQL database)
- ✅ Typo tolerance (handles common spelling mistakes)
- ✅ Easy maintenance (single source of truth)
- ✅ Consistent behavior across environments

For most applications with < 10,000 pets, this solution is optimal. For larger scales, consider migrating to database-level fuzzy search using the migration path described above.
