# ✅ Offline-First Integration Checklist

## Backend Setup ✓
- [x] Flask backend running on http://localhost:5000
- [x] `/api/offline/bootstrap` endpoint returns trips, posts, saved_destinations
- [x] Session authentication working (cookies)
- [x] Database schema includes created_at, updated_at, version fields

## Frontend Setup

### 1. Environment Configuration
- [ ] Create or update `.env.local` file in your React Native project
- [ ] Add: `EXPO_PUBLIC_API_URL=http://localhost:5000/api`
  - For web: use `http://localhost:5000/api`
  - For native (iOS/Android): use your machine's IP like `http://192.168.1.100:5000/api`

### 2. Install New Hook
- [ ] Copy `use-sync.ts` to your `hooks/` directory
  ```bash
  cp use-sync.ts hooks/use-sync.ts
  ```

### 3. Verify Existing Hooks
- [ ] `use-offline-db.ts` - Has `getTrips()`, `getCachedPosts()`, `saveAllTrips()`, `saveAllCachedPosts()`
- [ ] `use-network.ts` - Has `useNetwork()` hook
- [ ] `use-posts.tsx` - Uses cached posts from DB

### 4. Update Your Screens

#### Feed Screen (posts)
```tsx
// Add to app/(tabs)/feed.tsx
import { useSync } from '../../hooks/use-sync';

export default function Feed() {
  const { isOnline } = useNetwork();
  const { status, error } = useSync();  // Automatically syncs!
  const { posts } = usePosts();
  
  // Show sync indicator when syncing
  // Show offline banner when no internet
  // Posts automatically update when sync completes
}
```

#### Trips Screen
```tsx
// Add to app/(tabs)/trips.tsx (or wherever trips are shown)
import { useSync } from '../../hooks/use-sync';
import { getTrips } from '../../hooks/use-offline-db';

export default function TripsScreen() {
  const { isOnline } = useNetwork();
  const { status } = useSync();
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Load from local DB
  useEffect(() => {
    getTrips().then(setTrips);
  }, []);
  
  // Reload when sync completes
  useEffect(() => {
    if (status === 'success') {
      getTrips().then(setTrips);
    }
  }, [status]);
}
```

### 5. Initialize DB on App Start
- [ ] In your main `app.tsx` or entry point, call `initDB()`:
```tsx
import { initDB } from './hooks/use-offline-db';

// On app startup:
useEffect(() => {
  initDB().catch(console.error);
}, []);
```

### 6. Handle Authentication
- [ ] User should login first (calls `/api/login`)
- [ ] This sets the session cookie
- [ ] Then `useSync` can access protected endpoints
- [ ] Example:
```tsx
async function handleLogin(username: string, password: string) {
  const response = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include'  // Important: send cookies
  });
  // After this, useSync will work
}
```

## Testing

### Test 1: Sync Online
- [ ] Device/emulator connected to WiFi
- [ ] Backend running locally
- [ ] Open app
- [ ] Should see "Syncing..." message
- [ ] Posts/trips should appear in list
- [ ] Check console: `✓ Synced X posts`, `✓ Synced X trips`

### Test 2: View Offline
- [ ] Enable offline mode in DevTools / toggle WiFi off
- [ ] Close and reopen app
- [ ] Should see "You are offline" banner
- [ ] All posts/trips should still be visible
- [ ] Data loaded from local DB

### Test 3: Sync After Reconnect
- [ ] Start in offline mode
- [ ] Use app normally
- [ ] Re-enable WiFi / go online
- [ ] Wait 5 seconds (or click refresh)
- [ ] Should see "Syncing..." message
- [ ] Data updates with fresh backend data

### Test 4: Session Persistence
- [ ] Login once
- [ ] Close app completely
- [ ] Reopen app
- [ ] Should automatically sync (session cookie persists)
- [ ] No need to login again

## Debugging

### Check Sync Status in Console
```jsx
// In your component:
const { status, error, lastSyncTime } = useSync();
console.log('Sync status:', status);
console.log('Last sync:', new Date(lastSyncTime || 0));
console.log('Error:', error);
```

### Test Backend Connection
```javascript
// In browser console or React Native debugger:
fetch('http://localhost:5000/api/offline/bootstrap', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

### Check Local DB (Web)
```javascript
// In browser console:
localStorage.getItem('active_trips')
localStorage.getItem('cached_posts')
```

### Monitor Network State
```jsx
// In your component:
const { isOnline } = useNetwork();
useEffect(() => {
  console.log('Online?', isOnline);
}, [isOnline]);
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Sync failed: HTTP 401" | Login first, session cookie not set |
| "Sync failed: ECONNREFUSED" | Backend not running, check localhost:5000 |
| "No internet" on useNetwork | Check WiFi, or add to allowed hosts in Expo config |
| Data not updating | Check EXPO_PUBLIC_API_URL, verify backend returns data |
| Offline mode not working | Verify use-offline-db.ts tables exist, check localStorage |
| Sync only works on web | Native iOS/Android needs correct IP (not localhost) |

## Common Issues

**Issue: "useSync not found"**
- [ ] Did you copy `use-sync.ts` to `hooks/`?
- [ ] Check import path: `import { useSync } from '../../hooks/use-sync'`

**Issue: "Cannot find module 'use-offline-db'"**
- [ ] Verify `use-offline-db.ts` exists in `hooks/`
- [ ] Check import case sensitivity

**Issue: "Sync says success but no data appears"**
- [ ] Verify you're reloading the list after sync completes
- [ ] Check: `useEffect(() => { loadData() }, [status])`
- [ ] Debug: Log the response from backend

**Issue: "Works on web, not on native"**
- [ ] Use your machine's IP instead of `localhost`
- [ ] Example: `http://192.168.1.100:5000/api`
- [ ] Or use ngrok to tunnel: `ngrok http 5000`

## Next: Enable Uploads (Coming Soon)

Once syncing works, you can add:
- [ ] Create trip endpoint: POST /api/trips
- [ ] Update trip endpoint: PUT /api/trips/123
- [ ] Create post endpoint: POST /api/posts
- [ ] Delete with version check for conflict resolution

## Verification: Everything Working? ✅

When complete, you should be able to:
- [ ] Start app → automatically syncs (if online)
- [ ] Disable WiFi → offline banner appears
- [ ] Tap trip → full offline experience
- [ ] Re-enable WiFi → automatic refresh
- [ ] See "Synced X posts" in console
- [ ] No data loss when going offline/online
