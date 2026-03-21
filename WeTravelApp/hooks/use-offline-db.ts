import * as SQLite from 'expo-sqlite';

export type Trip = {
  id: string;
  location_name: string;
  address: string;
  planned_time: string;
  duration_hours: number;
  note: string;
  location_place_id: string;
  order_index: number;
  latitude: number;
  longitude: number;
  status: string;
  actual_arrival_time: string | null;
};

const DB_NAME = 'wetravel.db';

function getDb(): SQLite.SQLiteDatabase {
  return SQLite.openDatabaseSync(DB_NAME);
}

export async function initDB(): Promise<void> {
  const db = getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY NOT NULL,
      location_name TEXT NOT NULL,
      address TEXT NOT NULL,
      planned_time TEXT NOT NULL,
      duration_hours REAL NOT NULL,
      note TEXT NOT NULL,
      location_place_id TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      status TEXT NOT NULL,
      actual_arrival_time TEXT
    );
  `);
}

export async function getTrips(): Promise<Trip[]> {
  const db = getDb();
  return db.getAllAsync<Trip>(
    'SELECT * FROM trips ORDER BY order_index ASC;'
  );
}

export async function saveTrip(trip: Trip): Promise<void> {
  const db = getDb();
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
      trip.planned_time,
      trip.duration_hours,
      trip.note,
      trip.location_place_id,
      trip.order_index,
      trip.latitude,
      trip.longitude,
      trip.status,
      trip.actual_arrival_time ?? null,
    ]
  );
}
