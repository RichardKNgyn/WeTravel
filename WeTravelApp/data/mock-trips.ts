export type TripDestination = {
  id: string;
  location_name: string;
  address?: string;
  planned_date: string | null;
  planned_time: string | null;
  duration_hours: number | null;
  note: string;
  location_place_id: string;
  order_index: number;
  latitude?: number; // Optional coordinates for navigtion and offline access
  longitude?: number; // Optional coordinates for navigation and offline access
  status?: 'Pending' | 'Active' | 'Completed'; // Optional status to track trip progress
  actual_arrival_time?: string | null; // Incase of schedule shifting
  opening_hours?: string | null;
};

export const MOCK_TRIP_DATA: TripDestination[] = [
  {
    id: "1",
    location_name: "Arboretum at CSUF",
    address: "1900 Associated Rd, Fullerton, CA 92831",
    planned_date: null,
    planned_time: "09:00 AM",
    duration_hours: 2,
    note: "Great for nature photography.",
    location_place_id: "ChIJOaBMicnV3IARAL72MNhOh80",
    order_index: 0,
    opening_hours: null
  },
  {
    id: "2",
    location_name: "Fullerton Downtown Plaza",
    address: "125 E Wilshire Ave, Fullerton, CA 92832",
    planned_date: null,
    planned_time: "12:00 PM",
    duration_hours: 2.5,
    note: "Lunch and exploring local shops.",
    location_place_id: "ChIJ65HPTPbV3IARj8HPkOmoYYU",
    order_index: 1,
    opening_hours: null
  },
  {
    id: "3",
    location_name: "Fullerton Public Library",
    address: "353 W Commonwealth Ave, Fullerton, CA 92832",
    planned_date: null,
    planned_time: "03:00 PM",
    duration_hours: 1,
    note: "Quiet place to relax and read.",
    location_place_id: "ChIJPzcS0Agq3YARBjoSIHgyZes",
    order_index: 2,
    opening_hours: null
  },
  {
    id: "4",
    location_name: "Craig Regional Park",
    address: "3300 State College Blvd, Fullerton, CA 92835",
    planned_date: null,
    planned_time: "04:20 PM",
    duration_hours: 1,
    note: "Evening walk around the lake.",
    location_place_id: "ChIJG1_FWK7V3IARkjII9bGecL8",
    order_index: 3,
    opening_hours: null
  },
  {
    id: "5",
    location_name: "57 Bar & Grill",
    address: "2932 Nutwood Ave, Fullerton, CA 92831",
    planned_date: null,
    planned_time: "05:40 PM",
    duration_hours: 2,
    note: "Dinner with drink specials.",
    location_place_id: "ChIJz0AqP9PV3IARyHPK7V4g7Q4",
    order_index: 4,
    opening_hours: null
  },
  {
    id: "6",
    location_name: "Fullerton Marriott at CSU",
    address: "2701 Nutwood Ave, Fullerton, CA 92831",
    planned_date: null,
    planned_time: "09:00 PM",
    duration_hours: 12,
    note: "Overnight stay.",
    location_place_id: "ChIJJyOzadLV3IARBiUbk-QX97k",
    order_index: 5,
    opening_hours: null
  }
];