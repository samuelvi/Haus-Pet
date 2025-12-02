# ADR: Use Cursor-Based Pagination Without Count Query

**Status:** Accepted
**Date:** 2025-12-02
**Deciders:** Development Team
**Tags:** pagination, performance, api-design

## Context

Currently, traditional pagination implementations require two database queries:
1. A COUNT query to determine total number of records
2. A SELECT query with LIMIT/OFFSET to fetch the actual data

This COUNT query can become expensive as the dataset grows, especially when:
- Tables have millions of records
- Complex filters or JOINs are involved
- The count is performed on every page request

For public-facing API endpoints listing resources (breeds, pets, users), we need an efficient pagination strategy that:
- Minimizes database load
- Provides good user experience
- Scales well with large datasets
- Avoids unnecessary complexity

## Decision

We will implement **cursor-based pagination without count** using the "N+1 fetch pattern":

### Implementation Strategy

1. **Query N+1 Records**: When requesting a page with limit N, we fetch N+1 records from the database
   - Example: If limit=20, fetch 21 records

2. **Return N Records**: Display only the first N records to the user

3. **Use the Extra Record as Signal**: The N+1 record indicates if there are more pages
   - If we got N+1 records → "Next" button is shown
   - If we got ≤N records → No "Next" button (last page)

4. **Show Previous Based on Page Number**:
   - If page=1 → Hide "Previous" button
   - If page>1 → Show "Previous" button

### API Response Format

```json
{
  "status": "OK",
  "data": {
    "items": [...],  // Array of N items
    "pagination": {
      "page": 1,
      "limit": 20,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### Query Parameters

- `page` (default: 1): Current page number (1-indexed)
- `limit` (default: 20): Number of items per page
- Additional filters as needed (type, search, etc.)

### Example Implementation

```typescript
// Service layer
async findAll(page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  // Fetch N+1 records
  const items = await db.query({
    take: limit + 1,
    skip: offset
  });

  // Check if there are more pages
  const hasNext = items.length > limit;

  // Return only N items
  const displayItems = hasNext ? items.slice(0, limit) : items;

  return {
    items: displayItems,
    pagination: {
      page,
      limit,
      hasNext,
      hasPrevious: page > 1
    }
  };
}
```

## Consequences

### Positive

- **Performance**: Eliminates expensive COUNT queries
- **Scalability**: Query time is constant regardless of total dataset size
- **Simplicity**: Straightforward implementation
- **Database Load**: Reduces database load by ~50% (one query instead of two)
- **Sufficient UX**: Previous/Next buttons provide adequate navigation for most use cases

### Negative

- **No Total Count**: Users cannot see total number of pages or records
- **No Jump to Page**: Cannot jump directly to page N (e.g., "Go to page 5")
- **No "X of Y" Display**: Cannot show "Page 3 of 10" type indicators
- **Slight Overhead**: Fetches one extra record per request (negligible impact)

### Neutral

- **Navigation Pattern**: Uses Previous/Next instead of numeric pagination
- **User Expectation**: Most modern applications use this pattern (Twitter, Instagram, etc.)

## Affected Endpoints

This strategy will be applied to:

- `GET /api/breeds` - List all breeds
- `GET /api/breeds/:type` - List breeds by type
- `GET /api/pets` - List all pets
- `GET /api/pets/type/:type` - List pets by type
- `GET /api/admin/*` - Any admin listing endpoints

## Alternatives Considered

### 1. Traditional Pagination with COUNT

```
PROs: Complete information (total pages, records)
CONs: Expensive COUNT query, slow with large datasets
```

### 2. Cursor-Based with Keyset Pagination

```
PROs: Best performance, no OFFSET
CONs: Complex implementation, requires indexed cursor field, harder to implement "previous"
```

### 3. Infinite Scroll

```
PROs: Modern UX, no pagination UI needed
CONs: Poor accessibility, hard to reach footer, can't bookmark position
```

## Related Documents

- [API Design Guidelines](../API.md)
- [Database Performance Best Practices](../PRODUCTION.md)

## Notes

- This approach works best for sequential browsing patterns
- If analytics show users need total counts, we can add optional COUNT as a separate cached endpoint
- Frontend should handle pagination state and button visibility based on response metadata
