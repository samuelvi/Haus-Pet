# Offline Persistence Architecture

## Overview

HausPet implements a robust offline-first architecture using **TanStack Query + Dexie.js + Outbox Pattern** to ensure users never lose data when internet connectivity is unreliable or interrupted.

## Architecture Components

### 1. TanStack Query (React Query) v5

**Purpose**: Client-side caching, synchronization, and state management for server state.

**Key Features**:
- Automatic caching of API responses
- Background refetching when data becomes stale
- Automatic retry with exponential backoff
- Optimistic updates for instant UI feedback
- Deduplication of concurrent requests
- Window focus and network reconnection refetching
- DevTools for debugging

**Configuration**: `app/frontend/src/lib/queryClient.ts`

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,      // 24h cache retention
      staleTime: 1000 * 60 * 5,         // 5min fresh time
      retry: 3,                          // 3 retries on failure
      networkMode: 'offlineFirst',       // Offline-first strategy
    },
    mutations: {
      retry: 3,
      networkMode: 'offlineFirst',
    },
  },
});
```

### 2. Dexie.js (IndexedDB Wrapper)

**Purpose**: Local database for persistent storage of form drafts, pending commands, and cached entities.

**Schema**: `app/frontend/src/db/db.ts`

```typescript
class HausPetDB extends Dexie {
  formDrafts!: EntityTable<FormDraft, 'id'>;
  pendingCommands!: EntityTable<PendingCommand, 'id'>;
  cachedEntities!: EntityTable<CachedEntity, 'id'>;
}
```

**Tables**:
- `formDrafts`: Auto-saved form data (ID, type, data, timestamp)
- `pendingCommands`: Queued write operations for offline execution
- `cachedEntities`: Additional cached data with expiration

**Advantages over localStorage**:
| Feature | localStorage | IndexedDB (Dexie) |
|---------|--------------|-------------------|
| Storage Limit | ~5-10 MB | ~50 MB+ |
| Performance | Synchronous (blocks UI) | Asynchronous |
| Data Types | Strings only | Objects, Blobs, Files |
| Queries | Manual iteration | Indexed queries |
| Transactions | ❌ | ✅ ACID compliant |

### 3. Outbox Pattern

**Purpose**: Reliable command execution for write operations (Create, Update, Delete) with automatic retry and synchronization.

**Implementation**: `app/frontend/src/services/outbox-sync.service.ts`

**Flow**:
1. User performs write operation (create/update/delete)
2. Command saved to `pendingCommands` table in IndexedDB
3. Immediate execution attempt
4. If offline or fails: command stays in outbox
5. Background service syncs every 30s + on reconnection
6. Exponential backoff retry (max 5 attempts)
7. On success: remove from outbox
8. On permanent failure: mark for manual resolution

**Command Structure**:
```typescript
interface PendingCommand {
  id: string;
  type: 'CREATE_PET' | 'UPDATE_PET' | 'DELETE_PET' | 'CREATE_BREED' | ...;
  payload: Record<string, any>;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}
```

## Data Flow

### Read Operations (Queries)

```
User requests data
       ↓
TanStack Query checks cache
       ↓
Cache HIT? → Return immediately (with stale indicator)
       ↓
Cache MISS or Stale? → Fetch from API
       ↓
Update cache + IndexedDB persister
       ↓
Return to UI
```

### Write Operations (Mutations)

```
User submits form
       ↓
Save command to IndexedDB outbox
       ↓
Optimistic update in TanStack Query cache
       ↓
UI shows success immediately
       ↓
Attempt API call
       ↓
SUCCESS? → Remove from outbox + invalidate queries
       ↓
FAILURE? → Keep in outbox + revert optimistic update
       ↓
Retry with exponential backoff
```

### Background Synchronization

```
OutboxSyncService running every 30s
       ↓
Check if online
       ↓
Fetch pending commands from IndexedDB
       ↓
For each command:
  - Attempt execution
  - On success: delete from outbox
  - On failure: increment retry count
  - Max retries (5): mark as failed
       ↓
Broadcast sync-complete to other tabs
```

## Implementation Details

### Form Auto-Save

**Hook**: `app/frontend/src/hooks/usePersistedForm.ts`

Features:
- Auto-saves form data to IndexedDB on every change
- Restores draft on component mount
- Clears draft after successful submission
- Reactive updates using `useLiveQuery` from dexie-react-hooks

Example Usage:
```tsx
const { draft, saveDraft, clearDraft, hasDraft } = usePersistedForm({
  formId: 'breed-form-create',
  formType: 'breed',
});

// Auto-save on change
useEffect(() => {
  if (formData.name) {
    saveDraft(formData);
  }
}, [formData]);

// Restore on mount
useEffect(() => {
  if (draft && !formData.name) {
    setFormData(draft);
  }
}, [draft]);

// Clear after submit
onSuccess: () => clearDraft()
```

### Optimistic Updates

All mutations implement optimistic updates for instant UI feedback:

```typescript
export function useCreateBreed({ accessToken, sessionId }) {
  const queryClient = useQueryClient();

  return useMutation({
    // Save to outbox + execute
    mutationFn: async (data) => {
      await db.pendingCommands.add({...});
      return apiService.createBreed(data, accessToken, sessionId);
    },

    // Update UI immediately
    onMutate: async (newBreed) => {
      await queryClient.cancelQueries({ queryKey: ['breeds'] });
      const previousBreeds = queryClient.getQueryData(['breeds']);

      queryClient.setQueryData(['breeds'], (old) => ({
        ...old,
        data: {
          items: [{ id: `temp-${Date.now()}`, ...newBreed }, ...old.data.items],
          pagination: old.data.pagination,
        },
      }));

      return { previousBreeds };
    },

    // Revert on error
    onError: (err, newBreed, context) => {
      queryClient.setQueryData(['breeds'], context.previousBreeds);
    },

    // Refetch on success
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['breeds'] });
    },
  });
}
```

### Event Sourcing Integration

Pet aggregates use Event Sourcing, which requires special handling:

**Challenge**: Projections (read models) may take time to update after command execution.

**Solution**:
- Use outbox pattern to queue commands
- Optimistic updates show immediate feedback
- Delay invalidation by 500ms to allow projection to complete
- Background refetch every 30s to catch eventual consistency

```typescript
onSuccess: async (data, { id }) => {
  // Remove from outbox
  await db.pendingCommands.delete(commandId);

  // Wait for projection to update read model
  setTimeout(async () => {
    await queryClient.invalidateQueries({ queryKey: ['pets'] });
    await queryClient.invalidateQueries({ queryKey: ['pet', id] });
  }, 500);
},
```

## Cross-Tab Synchronization

Uses `broadcast-channel` library to sync state across browser tabs:

```typescript
private syncChannel: BroadcastChannel<{ type: 'sync-complete' }>;

// After successful sync
await this.syncChannel.postMessage({ type: 'sync-complete' });

// Other tabs react
this.syncChannel.onmessage = (msg) => {
  if (msg.type === 'sync-complete') {
    queryClient.invalidateQueries();
  }
};
```

## Network Detection

Listens to browser online/offline events:

```typescript
window.addEventListener('online', () => this.handleOnline());
window.addEventListener('offline', () => this.handleOffline());

private handleOnline(): void {
  this.isOnline = true;
  void this.syncPendingCommands(); // Immediate sync
}

private handleOffline(): void {
  this.isOnline = false;
  // UI can show offline indicator
}
```

## User Experience

### Offline Indicators
- **Draft Restored**: Badge shown when form draft is loaded
- **Saving...**: Button state during mutation
- **Syncing...**: Background sync in progress
- **Failed**: Commands that exceeded max retries

### Data Consistency
- **Optimistic UI**: Changes appear immediately
- **Automatic Sync**: No user action required
- **Conflict Resolution**: Last write wins (CRUD) / Event ordering (Event Sourcing)
- **Eventual Consistency**: Read models catch up automatically

### Error Handling
- **Automatic Retry**: 3-5 retries with exponential backoff
- **User Notification**: Alert for permanent failures
- **Manual Resolution**: Failed commands accessible via IndexedDB

## Performance Optimizations

### Caching Strategy
- **Stale-While-Revalidate**: Return cached data immediately, fetch in background
- **Garbage Collection**: Unused queries removed after 24h
- **Selective Invalidation**: Only refetch affected queries

### Request Deduplication
TanStack Query automatically deduplicates concurrent requests to the same endpoint.

### Pagination
- Cursor-based pagination on backend (N+1 pattern)
- Cached pages in TanStack Query
- Infinite scroll support (can be added via `useInfiniteQuery`)

## Debugging

### React Query DevTools
Enabled in development mode:

```tsx
<ReactQueryDevtools initialIsOpen={false} />
```

Features:
- View all active queries and their states
- Inspect cached data
- Manually trigger refetch/invalidation
- See mutation history
- Monitor background fetching

### IndexedDB Inspector
Use browser DevTools → Application → IndexedDB → HausPetDB

Tables:
- `formDrafts`: See auto-saved form data
- `pendingCommands`: Monitor queued operations
- `cachedEntities`: View cached data

### Console Logging
Outbox service logs all sync operations:
```
[Outbox] Starting sync service
[Outbox] Found 3 commands to sync
[Outbox] Successfully synced command abc123 (CREATE_BREED)
[Outbox] Sync complete: 2 synced, 1 failed, 0 pending
```

## Migration Guide

### Converting Existing Components

#### Before (useState + fetch)
```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetch('/api/breeds')
    .then(res => res.json())
    .then(data => setData(data))
    .finally(() => setLoading(false));
}, []);
```

#### After (TanStack Query)
```tsx
const { data, isLoading } = useBreeds();
```

#### Before (Manual Submit)
```tsx
const handleSubmit = async () => {
  setSubmitting(true);
  try {
    await apiService.createBreed(formData, token, session);
    navigate('/admin/breeds');
  } catch (err) {
    setError(err.message);
  } finally {
    setSubmitting(false);
  }
};
```

#### After (Mutation Hook)
```tsx
const createMutation = useCreateBreed({ accessToken, sessionId });

const handleSubmit = async () => {
  try {
    await createMutation.mutateAsync(formData);
    await clearDraft();
    navigate('/admin/breeds');
  } catch (err) {
    // Error in mutation state
  }
};
```

## Testing

### Unit Tests
Test hooks in isolation:
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useBreeds } from './useBreedQueries';

test('useBreeds fetches and caches data', async () => {
  const { result } = renderHook(() => useBreeds());

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBeDefined();
});
```

### Integration Tests
Test full flows with MSW (Mock Service Worker):
```typescript
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/breeds', (req, res, ctx) => {
    return res(ctx.json({ status: 'OK', data: { items: [...] } }));
  })
);

test('creates breed offline and syncs when online', async () => {
  // ... test implementation
});
```

## Monitoring

### Metrics to Track
- Outbox queue length
- Failed command count
- Average sync time
- Cache hit rate
- Network error rate

### Alerts
- Commands exceeding max retries
- Outbox queue growing indefinitely
- High network error rate

## Future Enhancements

### Potential Improvements
1. **Conflict Resolution UI**: Show conflicts and let users resolve
2. **Selective Sync**: Prioritize certain command types
3. **Compression**: Compress cached data to save space
4. **Service Worker**: Cache API responses at network level
5. **WebSocket Integration**: Real-time updates for multi-user scenarios
6. **Optimistic Locking**: Prevent concurrent edit conflicts

### Advanced Patterns
- **Delta Sync**: Only sync changed fields
- **Batching**: Combine multiple commands into single request
- **Priority Queue**: Execute critical commands first
- **Versioning**: Handle schema changes in cached data

## Conclusion

The TanStack Query + Dexie.js + Outbox Pattern architecture provides:
- ✅ **Zero data loss** from network interruptions
- ✅ **Instant UI feedback** with optimistic updates
- ✅ **Automatic synchronization** requiring no user action
- ✅ **Event Sourcing compatibility** with projection awareness
- ✅ **Production-ready reliability** with retry and error handling
- ✅ **Developer-friendly** with excellent debugging tools

This architecture ensures HausPet admin users can work confidently regardless of network conditions, with all changes safely queued and automatically synchronized when connectivity is restored.
