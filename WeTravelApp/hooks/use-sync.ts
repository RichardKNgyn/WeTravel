import { Platform } from 'react-native';
import { initDB, saveAllCachedPosts, saveAllTrips } from './use-offline-db';

// For Android emulator, localhost is 10.0.2.2. For iOS simulator, it's localhost.
// For physical devices, needs local IP address.
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getBaseUrl();

/**
 * Simple one-time sync: fetch bootstrap and save to local DB
 * Returns { success: boolean, error?: string }
 */
export async function syncOfflineData(): Promise<{ success: boolean; error?: string }> {
  try {
    await initDB();

    // Fetch from backend
    const response = await fetch(`${API_BASE_URL}/offline/bootstrap`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    // Convert and save trips
    if (data.trips && Array.isArray(data.trips)) {
      const localTrips = data.trips.map((trip: any, idx: number) => ({
        id: String(trip.id),
        location_name: trip.name || 'Untitled Trip',
        address: trip.description || '',
        planned_date: null,
        planned_time: null,
        duration_hours: null,
        note: trip.description || '',
        location_place_id: String(trip.id),
        order_index: idx,
        latitude: null,
        longitude: null,
        status: null,
        actual_arrival_time: null,
        opening_hours: null,
        original_planned_time: null,
        original_planned_date: null,
      }));
      await saveAllTrips(localTrips);
    }

    // Convert and save posts
    if (data.posts && Array.isArray(data.posts)) {
      const localPosts = data.posts.map((post: any) => ({
        id: String(post.id),
        author: 'WeTravel User',
        location: null,
        images: '',
        title: post.title || 'Untitled',
        description: post.content || '',
        likes: 0,
        comments: '[]',
        createdAt: post.created_at || new Date().toISOString(),
      }));
      await saveAllCachedPosts(localPosts);
    }

    console.log('✓ Offline data synced');
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('✗ Sync failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
