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

export async function initDB(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!db) return;
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
      opening_hours TEXT
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
  `);

  try { await db.execAsync('ALTER TABLE trips ADD COLUMN planned_date TEXT;'); } catch (e) {}
  try { await db.execAsync('ALTER TABLE trips ADD COLUMN opening_hours TEXT;'); } catch (e) {}
  
  try { await db.execAsync('ALTER TABLE saved_destinations ADD COLUMN planned_date TEXT;'); } catch (e) {}
  try { await db.execAsync('ALTER TABLE saved_destinations ADD COLUMN opening_hours TEXT;'); } catch (e) {}
}

export async function getTrips(): Promise<Trip[]> {
  if (Platform.OS === 'web') return JSON.parse(localStorage.getItem('active_trips') || '[]');
  if (!db) return [];
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
      status, actual_arrival_time, opening_hours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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

export async function saveAllTrips(trips: Trip[]): Promise<void> {
  if (Platform.OS === 'web') return localStorage.setItem('active_trips', JSON.stringify(trips));
  if (!db) return;
  await db.runAsync('DELETE FROM trips;');
  for (const trip of trips) await saveTrip(trip);
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