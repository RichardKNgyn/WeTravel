# Minimal Offline Sync - Setup & Usage

## The Setup (3 Files)

### 1. `hooks/use-sync.ts` ✓ (Created)
One function:
```typescript
export async function syncOfflineData(): Promise<{ success: boolean; error?: string }>
```

**What it does:**
- Fetches `/api/offline/bootstrap`
- Converts backend data to your local DB shape
- Saves using `saveAllTrips()` and `saveAllCachedPosts()`
- Returns `{ success: true }` or `{ success: false, error: "..." }`

---

## How to Use

### Step 1: Call sync on app startup

In your app entry point (wherever you initialize the app):

```typescript
// app.tsx or App.tsx

import { useEffect } from 'react';
import { useNetwork } from './hooks/use-network';
import { syncOfflineData } from './hooks/use-sync';
import { initDB } from './hooks/use-offline-db';

export default function App() {
  const { isOnline } = useNetwork();

  useEffect(() => {
    async function startup() {
      await initDB();  // Initialize local DB
      
      if (isOnline) {
        const result = await syncOfflineData();
        if (result.success) {
          console.log('✓ Data synced');
        } else {
          console.log('✗ Sync failed:', result.error);
        }
      }
    }

    startup();
  }, [isOnline]);

  return (
    // Your app navigation...
  );
}
```

That's it. Now your local DB has the latest data from backend.

---

### Step 2: Screens always load from local DB

**Your screens don't change much.** Just load from local DB like you always do:

```typescript
import { getTrips } from '../../hooks/use-offline-db';

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    // Load from local DB (works online and offline)
    getTrips().then(setTrips);
  }, []);

  return (
    <FlatList data={trips} renderItem={...} />
  );
}
```

**That's all.** No API calls in screens. No `useSync()` hook needed in screens. Just local DB.

---

## The Data Flow

```
App starts (online)
    ↓
Call syncOfflineData()
    ↓
Fetch /api/offline/bootstrap
    ↓
Save to local SQLite/localStorage
    ↓
Screen loads → calls getTrips()
    ↓
Data comes from local DB
    ↓
Works offline ✓
```

---

## Example Files

1. **`APP_STARTUP_EXAMPLE.tsx`** - Where to call `syncOfflineData()`
2. **`TRIPS_SCREEN_EXAMPLE.tsx`** - Simple screen that loads from local DB only
3. **`hooks/use-sync.ts`** - The sync function

---

## That's it. Really.

- ✅ One function to sync
- ✅ Call it once on startup
- ✅ Screens load from local DB
- ✅ Works offline
- ✅ No timers, no background loops, no complexity

When you're ready for incremental syncing or periodic updates, just call `syncOfflineData()` again.
