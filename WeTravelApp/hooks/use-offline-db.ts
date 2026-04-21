import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

export type Trip = {
  id: string;
  location_name: string;
  address: string;
  planned_date: string | null;
  planned_time: string | null;
  duration_hours: number | null;
  note: string;
  location_place_id: string;
  order_index: number;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
  actual_arrival_time: string | null;
  opening_hours: string | null;
  original_planned_time?: string | null;
  original_planned_date?: string | null;
};

export type CachedPost = {
  id: string;
  author: string;
  location: string | null;
  images: string;
  title: string;
  description: string;
  likes: number;
  isLiked: boolean;
  comments: string;
  createdAt: string;
};

export type Itinerary = {
  id: string;
  name: string;
  created_at: string;
};

const DB_NAME = 'wetravel.db';

let db: SQLite.SQLiteDatabase | null = null;

if (Platform.OS !== 'web') {
  try {
    db = SQLite.openDatabaseSync(DB_NAME);
  } catch (e) {
    console.warn("SQLite not available in this environment:", e);
  }
}

let initPromise: Promise<void> | null = null;

export function initDB(): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  if (!db) return Promise.resolve();
  
  if (!initPromise) {
    initPromise = (async () => {
      await db.execAsync('PRAGMA foreign_keys = ON;');

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS trips (
          id TEXT PRIMARY KEY NOT NULL,
          location_name TEXT NOT NULL,
          address TEXT NOT NULL,
          planned_date TEXT,
          planned_time TEXT,
          duration_hours REAL,
          note TEXT NOT NULL,
          location_place_id TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          latitude REAL,
          longitude REAL,
          status TEXT,
          actual_arrival_time TEXT,
          opening_hours TEXT,
          original_planned_time TEXT,
          original_planned_date TEXT
        );

        CREATE TABLE IF NOT EXISTS itineraries (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS saved_destinations (
          id TEXT PRIMARY KEY NOT NULL,
          itinerary_id TEXT NOT NULL,
          location_name TEXT NOT NULL,
          address TEXT NOT NULL,
          planned_date TEXT,
          planned_time TEXT,
          duration_hours REAL,
          note TEXT NOT NULL,
          location_place_id TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          latitude REAL,
          longitude REAL,
          opening_hours TEXT,
          FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS cached_posts (
          id TEXT PRIMARY KEY NOT NULL,
          author TEXT NOT NULL,
          location TEXT,
          images TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          likes INTEGER NOT NULL,
          comments TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS liked_posts (
          post_id TEXT PRIMARY KEY NOT NULL
        );

        CREATE TABLE IF NOT EXISTS saved_posts (
          post_id TEXT PRIMARY KEY NOT NULL
        );
      `);

      try { await db.execAsync('ALTER TABLE trips ADD COLUMN planned_date TEXT;'); } catch (e) {}
      try { await db.execAsync('ALTER TABLE trips ADD COLUMN opening_hours TEXT;'); } catch (e) {}
      try { await db.execAsync('ALTER TABLE trips ADD COLUMN original_planned_time TEXT;'); } catch (e) {}
      try { await db.execAsync('ALTER TABLE trips ADD COLUMN original_planned_date TEXT;'); } catch (e) {}
      
      try { await db.execAsync('ALTER TABLE saved_destinations ADD COLUMN planned_date TEXT;'); } catch (e) {}
      try { await db.execAsync('ALTER TABLE saved_destinations ADD COLUMN opening_hours TEXT;'); } catch (e) {}
    })();
  }
  
  return initPromise;
}

export async function getTrips(): Promise<Trip[]> {
  if (Platform.OS === 'web') return JSON.parse(localStorage.getItem('active_trips') || '[]');
  if (!db) return [];
  await initDB();
  return db.getAllAsync<Trip>(
    'SELECT * FROM trips ORDER BY order_index ASC;'
  );
}

export async function saveTrip(trip: Trip): Promise<void> {
  if (Platform.OS === 'web') {
    const trips = await getTrips();
    const existingIndex = trips.findIndex(t => t.id === trip.id);
    if (existingIndex >= 0) trips[existingIndex] = trip;
    else trips.push(trip);
    localStorage.setItem('active_trips', JSON.stringify(trips));
    return;
  }
  if (!db) return;
  await db.runAsync(
    `INSERT OR REPLACE INTO trips (
      id, location_name, address, planned_date, planned_time, duration_hours,
      note, location_place_id, order_index, latitude, longitude,
      status, actual_arrival_time, opening_hours, original_planned_time, original_planned_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      trip.id,
      trip.location_name || "",
      trip.address || "",
      trip.planned_date ?? null,
      trip.planned_time ?? null,
      trip.duration_hours ?? null,
      trip.note || "",
      trip.location_place_id || "",
      trip.order_index ?? 0,
      trip.latitude ?? null,
      trip.longitude ?? null,
      trip.status ?? null,
      trip.actual_arrival_time ?? null,
      trip.opening_hours ?? null,
      trip.original_planned_time ?? null,
      trip.original_planned_date ?? null,
    ]
  );
}

export async function deleteTrip(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    const trips = await getTrips();
    localStorage.setItem('active_trips', JSON.stringify(trips.filter(t => t.id !== id)));
    return;
  }
  if (!db) return;
  await db.runAsync('DELETE FROM trips WHERE id = ?;', [id]);
}

export async function clearActiveTrips(): Promise<void> {
  if (Platform.OS === 'web') return localStorage.removeItem('active_trips');
  if (!db) return;
  await db.runAsync('DELETE FROM trips;');
}

let isSaving = false;

export async function saveAllTrips(trips: Trip[]): Promise<void> {
  if (Platform.OS === 'web') return localStorage.setItem('active_trips', JSON.stringify(trips));
  if (!db) return;
  
  while (isSaving) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  isSaving = true;
  try {
    await db.runAsync('DELETE FROM trips;');
    for (const trip of trips) await saveTrip(trip);
  } finally {
    isSaving = false;
  }
}

export async function saveFullItinerary(name: string, destinations: Trip[]): Promise<void> {
  const itineraryId = Date.now().toString();
  
  if (Platform.OS === 'web') {
    const itineraries = JSON.parse(localStorage.getItem('itineraries') || '[]');
    const savedDestinations = JSON.parse(localStorage.getItem('saved_destinations') || '{}');
    itineraries.push({ id: itineraryId, name, created_at: new Date().toISOString() });
    savedDestinations[itineraryId] = destinations;
    localStorage.setItem('itineraries', JSON.stringify(itineraries));
    localStorage.setItem('saved_destinations', JSON.stringify(savedDestinations));
    return;
  }
  
  if (!db) throw new Error("Database offline");
  await db.runAsync('INSERT INTO itineraries (id, name) VALUES (?, ?);', [itineraryId, name]);
  for (const dest of destinations) {
    await db.runAsync(
      `INSERT INTO saved_destinations (
        id, itinerary_id, location_name, address, planned_date,
        planned_time, duration_hours, note, location_place_id, 
        order_index, latitude, longitude, opening_hours
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, 
      [
        (Date.now() + Math.random()).toString(), 
        itineraryId, 
        dest.location_name || "", 
        dest.address || "", 
        dest.planned_date ?? null,
        dest.planned_time ?? null, 
        dest.duration_hours ?? null, 
        dest.note || "", 
        dest.location_place_id || "", 
        dest.order_index ?? 0, 
        dest.latitude ?? null, 
        dest.longitude ?? null,
        dest.opening_hours ?? null
      ]
    );
  }
}

export async function getItineraries(): Promise<Itinerary[]> {
  if (Platform.OS === 'web') {
    const itins = JSON.parse(localStorage.getItem('itineraries') || '[]');
    return itins.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  if (!db) return [];
  return db.getAllAsync<Itinerary>('SELECT * FROM itineraries ORDER BY created_at DESC;');
}

export async function getSavedDestinations(itineraryId: string): Promise<Trip[]> {
  if (Platform.OS === 'web') {
    const saved = JSON.parse(localStorage.getItem('saved_destinations') || '{}');
    return saved[itineraryId] || [];
  }
  if (!db) return [];
  return db.getAllAsync<Trip>('SELECT * FROM saved_destinations WHERE itinerary_id = ? ORDER BY order_index ASC;', [itineraryId]);
}

export async function deleteFullItinerary(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    const itins = JSON.parse(localStorage.getItem('itineraries') || '[]');
    const saved = JSON.parse(localStorage.getItem('saved_destinations') || '{}');
    localStorage.setItem('itineraries', JSON.stringify(itins.filter((i: any) => i.id !== id)));
    delete saved[id];
    localStorage.setItem('saved_destinations', JSON.stringify(saved));
    return;
  }
  if (!db) return;
  await db.runAsync('DELETE FROM itineraries WHERE id = ?;', [id]);
}

export async function getCachedPosts(): Promise<CachedPost[]> {
  if (Platform.OS === 'web') return JSON.parse(localStorage.getItem('cached_posts') || '[]');
  if (!db) return [];
  await initDB();
  return db.getAllAsync<CachedPost>(
    'SELECT * FROM cached_posts ORDER BY createdAt DESC;'
  );
}

export async function saveCachedPost(post: CachedPost): Promise<void> {
  if (Platform.OS === 'web') {
    const posts = await getCachedPosts();
    const existingIndex = posts.findIndex(p => p.id === post.id);
    if (existingIndex >= 0) posts[existingIndex] = post;
    else posts.push(post);
    localStorage.setItem('cached_posts', JSON.stringify(posts));
    return;
  }
  if (!db) return;
  await initDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO cached_posts (
      id, author, location, images, title, description, likes, comments, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      post.id,
      post.author,
      post.location,
      post.images,
      post.title,
      post.description,
      post.likes,
      post.comments,
      post.createdAt,
    ]
  );
}

export async function saveAllCachedPosts(posts: CachedPost[]): Promise<void> {
  if (Platform.OS === 'web') return localStorage.setItem('cached_posts', JSON.stringify(posts));
  if (!db) return;
  await initDB();
  await db.runAsync('DELETE FROM cached_posts;');
  for (const post of posts) await saveCachedPost(post);
}

export async function getLikedPosts(): Promise<Set<string>> {
  if (Platform.OS === 'web') {
    const liked = JSON.parse(localStorage.getItem('liked_posts') || '[]');
    return new Set(liked);
  }
  if (!db) return new Set();
  await initDB();
  const rows = await db.getAllAsync<{ post_id: string }>('SELECT post_id FROM liked_posts;');
  return new Set(rows.map(r => r.post_id));
}

export async function saveLikedPosts(likedPosts: Set<string>): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem('liked_posts', JSON.stringify(Array.from(likedPosts)));
    return;
  }
  if (!db) return;
  await initDB();
  await db.runAsync('DELETE FROM liked_posts;');
  for (const postId of likedPosts) {
    await db.runAsync('INSERT INTO liked_posts (post_id) VALUES (?);', [postId]);
  }
}

export async function getSavedPosts(): Promise<Set<string>> {
  if (Platform.OS === 'web') {
    const saved = JSON.parse(localStorage.getItem('saved_posts') || '[]');
    return new Set(saved);
  }
  if (!db) return new Set();
  await initDB();
  const rows = await db.getAllAsync<{ post_id: string }>('SELECT post_id FROM saved_posts;');
  return new Set(rows.map(r => r.post_id));
}

export async function saveSavedPosts(savedPosts: Set<string>): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem('saved_posts', JSON.stringify(Array.from(savedPosts)));
    return;
  }
  if (!db) return;
  await initDB();
  await db.runAsync('DELETE FROM saved_posts;');
  for (const postId of savedPosts) {
    await db.runAsync('INSERT INTO saved_posts (post_id) VALUES (?);', [postId]);
  }
}
