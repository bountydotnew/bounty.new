# Data Fetching Hooks

## Batched Initial Data Loading

These hooks optimize initial page load by batching multiple API requests into a single HTTP call.

### `useInitialData()`

Fetches essential user data on mount.

```tsx
import { useInitialData } from '@/hooks/use-initial-data';

function MyComponent() {
  const { me, isLoading } = useInitialData();
  
  if (isLoading) return <Spinner />;
  
  return <div>Welcome {me?.name}!</div>;
}
```

### `useDashboardData()`

Batches all dashboard queries into one request:

```tsx
import { useDashboardData } from '@/hooks/use-dashboard-data';

function Dashboard() {
  const {
    bounties,
    myBounties,
    betaApplication,
    user,
    isLoading,
    refetch,
  } = useDashboardData({
    bountiesLimit: 50,
    myBountiesLimit: 10,
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <BountiesFeed bounties={bounties?.data} />
      <MyBounties bounties={myBounties?.data} />
    </div>
  );
}
```

## How Batching Works

1. **tRPC HTTP Batching**: Enabled via `maxURLLength` in `trpc.ts`
   - Multiple queries made in the same tick → combined into 1 HTTP request
   - Example: 4 separate queries = 1 network call

2. **React Query Caching**: 
   - `staleTime` prevents redundant fetches
   - Data is cached and reused across components

3. **Prefetching**:
   - `usePrefetchInitialData()` warms the cache on app mount
   - Subsequent components get instant data from cache

## Performance Benefits

### Before (3 separate requests):
```
GET /api/trpc/user.getMe
GET /api/trpc/bounties.fetchAllBounties
GET /api/trpc/bounties.fetchMyBounties
```

### After (1 batched request):
```
POST /api/trpc/user.getMe,bounties.fetchAllBounties,bounties.fetchMyBounties
```

**Result**: Faster initial load, reduced server overhead, better UX!

