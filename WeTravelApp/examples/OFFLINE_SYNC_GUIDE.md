/**
 * OFFLINE-FIRST FRONTEND INTEGRATION GUIDE
 * ========================================
 * 
 * This guide shows how your React Native frontend connects to your Flask backend
 * for offline-first travel data persistence.
 */

// ============================================================================
// 1. INITIALIZATION (Run once when app starts)
// ============================================================================

// In your app entry point (app.tsx or App.tsx):

import { initDB } from './hooks/use-offline-db';

async function initializeApp() {
  // Initialize local DB schema
  await initDB();
  console.log('✓ Local DB initialized');
}

// Call on app launch:
// initializeApp();


// ============================================================================
// 2. THE SYNC FLOW
// ============================================================================

/**
 * ONLINE STATE:
 * 1. User opens app
 * 2. useNetwork detects internet available
 * 3. useSync() automatically:
 *    - Fetches /api/offline/bootstrap
 *    - Receives trips, posts, saved_destinations
 *    - Stores everything in local SQLite/localStorage
 *    - Polls every 5 minutes for updates
 * 4. Frontend shows synced data from local DB
 * 
 * OFFLINE STATE:
 * 1. User loses connection
 * 2. useNetwork detects offline
 * 3. Frontend continues loading from local DB
 * 4. UI shows "offline" indicator
 * 5. All data continues to work (posts, trips, etc.)
 */


// ============================================================================
// 3. USING THE SYNC HOOK IN YOUR SCREENS
// ============================================================================

// In your screen components:

import { useSync } from '../hooks/use-sync';
import { useNetwork } from '../hooks/use-network';
import { getTrips, getCachedPosts } from '../hooks/use-offline-db';

export function MyTripScreen() {
  const { isOnline } = useNetwork();
  const { status, error, lastSyncTime } = useSync();
  const [trips, setTrips] = useState<Trip[]>([]);

  // Load from local DB
  useEffect(() => {
    async function load() {
      const data = await getTrips();
      setTrips(data);
    }
    load();
  }, []);

  // Reload when sync completes
  useEffect(() => {
    if (status === 'success') {
      getTrips().then(setTrips);
    }
  }, [status]);

  return (
    <View>
      {!isOnline && <Text>📱 Offline - showing cached data</Text>}
      {status === 'syncing' && <Text>🔄 Syncing...</Text>}
      {status === 'error' && <Text>❌ Sync failed: {error}</Text>}
      {/* Render your trips here */}
    </View>
  );
}


// ============================================================================
// 4. BACKEND API CONTRACT
// ============================================================================

/**
 * /api/register (POST)
 * { username, email, password }
 * → Sets session cookie, returns user
 * 
 * /api/login (POST)
 * { username, password }
 * → Sets session cookie, returns user
 * 
 * /api/offline/bootstrap (GET)
 * Returns complete offline cache:
 * {
 *   user_id: number,
 *   trips: [
 *     {
 *       id: number,
 *       name: string,
 *       description: string,
 *       user_id: number,
 *       created_at: ISO8601,
 *       updated_at: ISO8601,
 *       version: number,
 *       stops: [ // Nested trip items
 *         {
 *           id: number,
 *           trip_id: number,
 *           location: string,
 *           description: string,
 *           order: number,
 *           created_at: ISO8601,
 *           updated_at: ISO8601,
 *           version: number
 *         }
 *       ]
 *     }
 *   ],
 *   posts: [
 *     {
 *       id: number,
 *       title: string,
 *       content: string,
 *       user_id: number,
 *       created_at: ISO8601,
 *       updated_at: ISO8601,
 *       version: number
 *     }
 *   ],
 *   saved_destinations: [...]
 * }
 */


// ============================================================================
// 5. DATA CONVERSION (Backend → Frontend)
// ============================================================================

/**
 * The useSync hook automatically converts backend data to your local schema:
 * 
 * BACKEND TRIP:
 * {
 *   id: 1,
 *   name: "Paris Vacation",
 *   description: "Spring break trip"
 * }
 * 
 * → LOCAL TRIP:
 * {
 *   id: "1",
 *   location_name: "Paris Vacation",
 *   address: "Spring break trip",
 *   order_index: 0,
 *   ...other fields default to null
 * }
 * 
 * This keeps your existing Trip type intact while syncing from backend.
 */


// ============================================================================
// 6. TYPICAL USER FLOWS
// ============================================================================

// FLOW 1: Fresh app install
// 1. User registers/logs in
// 2. useSync detects online
// 3. Fetches /offline/bootstrap
// 4. Syncs all data locally
// 5. User can work offline immediately

// FLOW 2: Network interruption
// 1. User is using app with synced data
// 2. Network drops
// 3. useNetwork detects offline
// 4. UI shows "offline" banner
// 5. App continues working from local DB
// 6. User can still view trips, posts, destinations

// FLOW 3: Network restored
// 1. User's connection returns
// 2. useNetwork detects online
// 3. useSync auto-triggers refresh
// 4. Fetches fresh /offline/bootstrap
// 5. Updates local DB with new data
// 6. UI refreshes with latest data


// ============================================================================
// 7. ENVIRONMENT SETUP
// ============================================================================

/**
 * In your .env file (or .env.local for web):
 * 
 * EXPO_PUBLIC_API_URL=http://localhost:5000/api
 * 
 * Or for production:
 * EXPO_PUBLIC_API_URL=https://api.wetravel.app/api
 * 
 * The useSync hook will read this automatically.
 */


// ============================================================================
// 8. TROUBLESHOOTING
// ============================================================================

/**
 * Q: Data not syncing?
 * A: Check:
 *    1. Backend is running (http://localhost:5000)
 *    2. EXPO_PUBLIC_API_URL is correct
 *    3. Network is online (use useNetwork to verify)
 *    4. Session/cookies are working (login first)
 * 
 * Q: Posts from backend not showing?
 * A: Check backend response in browser console:
 *    fetch('http://localhost:5000/api/offline/bootstrap', { credentials: 'include' })
 * 
 * Q: Offline mode not working?
 * A: Verify use-offline-db.ts has all tables created:
 *    - trips
 *    - itineraries
 *    - saved_destinations
 *    - cached_posts
 * 
 * Q: Session expires - need to login again?
 * A: Normal - sessions are temporary. On production, consider:
 *    - Longer session TTL
 *    - JWT tokens in cookies
 *    - Refresh token mechanism
 */


// ============================================================================
// 9. NEXT STEPS
// ============================================================================

/**
 * 1. AUTHENTICATION:
 *    - Call /api/register or /api/login on app start
 *    - Store session in secure storage if needed
 *    - Handle session expiry gracefully
 * 
 * 2. CONFLICT RESOLUTION (offline-first sync):
 *    - Backend tracks `version` on each record
 *    - When uploading local changes, compare versions
 *    - Example: POST /api/trips/123/update with version check
 * 
 * 3. INCREMENTAL SYNC:
 *    - Instead of bootstrap every time, sync only changed records
 *    - Use `updated_at` timestamp to fetch only recent changes
 *    - Example: GET /api/sync?since=2024-01-20T10:00:00Z
 * 
 * 4. LOCAL EDITING + SYNC:
 *    - Allow users to edit trips/posts offline
 *    - Queue changes locally
 *    - When online, push changes to backend
 *    - Implement merge strategy for conflicts (last-write-wins)
 * 
 * 5. REAL-TIME SYNC:
 *    - Consider WebSockets for live updates
 *    - Example: ws://localhost:5000/sync for real-time notifications
 */


// ============================================================================
// 10. SIMPLE EXAMPLE: Complete Screen
// ============================================================================

/**
 * See trips.example.tsx for a complete working example that:
 * - Uses useSync to fetch from backend
 * - Uses useNetwork to detect offline
 * - Loads data from local DB
 * - Shows sync status
 * - Handles loading states
 */
