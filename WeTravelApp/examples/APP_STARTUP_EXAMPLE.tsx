/**
 * EXAMPLE: App Root/Entry Point
 * 
 * Call syncOfflineData() once when app starts (if online)
 * Then screens always load from local DB
 */

import { useEffect } from 'react';
import { useNetwork } from './hooks/use-network';
import { initDB } from './hooks/use-offline-db';
import { syncOfflineData } from './hooks/use-sync';

export default function App() {
  const { isOnline } = useNetwork();

  useEffect(() => {
    async function startup() {
      // Initialize local DB
      await initDB();

      // Sync from backend if online
      if (isOnline) {
        console.log('🌐 Online - syncing offline data...');
        const result = await syncOfflineData();
        if (result.success) {
          console.log('✓ Sync complete');
        } else {
          console.log('⚠️ Sync failed:', result.error);
          // App still works offline - just shows previously cached data
        }
      } else {
        console.log('📱 Offline - using cached data');
      }
    }

    startup();
  }, [isOnline]);

  return (
    // Your app navigation here
    <NavigationContainer>
      <Stack.Navigator>
        {/* Your screens */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
