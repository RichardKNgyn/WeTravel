import * as SQLite from 'expo-sqlite';

export type Trip = {
  id: string;
  location_name: string;
  address: string;
  planned_time: string | null;
  duration_hours: number | null;
  note: string;
  location_place_id: string;
  order_index: number;
  latitude: number | null;
  longitude: number | null;
  status: string | null;
  actual_arrival_time: string | null;
};

export type Itinerary = {
  id: string;
  name: string;
  created_at: string;
};

const DB_NAME = 'wetravel.db';

let db: SQLite.SQLiteDatabase | null = null;

try {
  db = SQLite.openDatabaseSync(DB_NAME);
} catch (e) {
  console.warn("SQLite not available in this environment:", e);
}

export async function initDB(): Promise<void> {
  if (!db) return;
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY NOT NULL,
      location_name TEXT NOT NULL,
      address TEXT NOT NULL,
      planned_time TEXT,
      duration_hours REAL,
      note TEXT NOT NULL,
      location_place_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      status TEXT,
      actual_arrival_time TEXT
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
      planned_time TEXT,
      duration_hours REAL,
      note TEXT NOT NULL,
      location_place_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
    );
  `);
}

export async function getTrips(): Promise<Trip[]> {
  if (!db) return [];
  return db.getAllAsync<Trip>(
    'SELECT * FROM trips ORDER BY order_index ASC;'
  );
}

export async function saveTrip(trip: Trip): Promise<void> {
  if (!db) return;
  await db.runAsync(
    `INSERT OR REPLACE INTO trips (
      id, location_name, address, planned_time, duration_hours,
      note, location_place_id, order_index, latitude, longitude,
      status, actual_arrival_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      trip.id,
      trip.location_name,
      trip.address,
      trip.planned_time ?? null,
      trip.duration_hours ?? null,
      trip.note,
      trip.location_place_id,
      trip.order_index,
      trip.latitude ?? null,
      trip.longitude ?? null,
      trip.status ?? null,
      trip.actual_arrival_time ?? null,
    ]
  );
}

export async function deleteTrip(id: string): Promise<void> {
  if (!db) return;
  await db.runAsync('DELETE FROM trips WHERE id = ?;', [id]);
}

export async function clearActiveTrips(): Promise<void> {
  if (!db) return;
  await db.runAsync('DELETE FROM trips;');
}

export async function saveAllTrips(trips: Trip[]): Promise<void> {
  if (!db) return;
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM trips;');
    for (const trip of trips) {
      await saveTrip(trip);
    }
  });
}

export async function saveFullItinerary(name: string, destinations: Trip[]): Promise<void> {
  if (!db) return;
  const itineraryId = Date.now().toString();
  
  await db.withTransactionAsync(async () => {
    await db.runAsync('INSERT INTO itineraries (id, name) VALUES (?, ?);', [itineraryId, name]);
    
    for (const dest of destinations) {
      await db.runAsync(
        `INSERT INTO saved_destinations (id, itinerary_id, location_name, 
        address, planned_time, duration_hours, note, location_place_id, 
        order_index, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          (Date.now() + Math.random()).toString(), 
          itineraryId, 
          dest.location_name, 
          dest.address, 
          dest.planned_time ?? null, 
          dest.duration_hours ?? null, 
          dest.note, 
          dest.location_place_id, 
          dest.order_index, 
          dest.latitude ?? null, 
          dest.longitude ?? null
        ]
      );
    }
  });
}

export async function getItineraries(): Promise<Itinerary[]> {
  if (!db) return [];
  return db.getAllAsync<Itinerary>('SELECT * FROM itineraries ORDER BY created_at DESC;');
}

export async function getSavedDestinations(itineraryId: string): Promise<Trip[]> {
  if (!db) return [];
  return db.getAllAsync<Trip>('SELECT * FROM saved_destinations WHERE itinerary_id = ? ORDER BY order_index ASC;', [itineraryId]);
}

export async function deleteFullItinerary(id: string): Promise<void> {
  if (!db) return;
  await db.runAsync('DELETE FROM itineraries WHERE id = ?;', [id]);
}