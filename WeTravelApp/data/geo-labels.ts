export type GeoLabel = {
  name: string;
  lat: number;
  lng: number;
};

export const CONTINENTS: GeoLabel[] = [
  { name: "North America", lat: 48, lng: -100 },
  { name: "South America", lat: -15, lng: -60 },
  { name: "Europe", lat: 54, lng: 15 },
  { name: "Africa", lat: 5, lng: 20 },
  { name: "Asia", lat: 45, lng: 80 },
  { name: "Oceania", lat: -25, lng: 135 },
  { name: "Antarctica", lat: -85, lng: 0 },
];

export const COUNTRIES: GeoLabel[] = [
  // North America
  { name: "United States", lat: 38, lng: -97 },
  { name: "Canada", lat: 60, lng: -95 },
  { name: "Mexico", lat: 23, lng: -102 },
  { name: "Cuba", lat: 22, lng: -80 },
  { name: "Guatemala", lat: 15, lng: -90 },

  // South America
  { name: "Brazil", lat: -10, lng: -55 },
  { name: "Argentina", lat: -34, lng: -64 },
  { name: "Colombia", lat: 4, lng: -72 },
  { name: "Chile", lat: -30, lng: -71 },
  { name: "Peru", lat: -10, lng: -76 },
  { name: "Venezuela", lat: 8, lng: -66 },
  { name: "Bolivia", lat: -17, lng: -65 },
  { name: "Ecuador", lat: -2, lng: -78 },

  // Europe
  { name: "United Kingdom", lat: 54, lng: -2 },
  { name: "France", lat: 46, lng: 2 },
  { name: "Germany", lat: 51, lng: 10 },
  { name: "Italy", lat: 42, lng: 12 },
  { name: "Spain", lat: 40, lng: -4 },
  { name: "Portugal", lat: 39, lng: -8 },
  { name: "Netherlands", lat: 52, lng: 5 },
  { name: "Belgium", lat: 50, lng: 4 },
  { name: "Switzerland", lat: 47, lng: 8 },
  { name: "Austria", lat: 47, lng: 14 },
  { name: "Poland", lat: 52, lng: 20 },
  { name: "Sweden", lat: 62, lng: 15 },
  { name: "Norway", lat: 62, lng: 10 },
  { name: "Finland", lat: 64, lng: 26 },
  { name: "Denmark", lat: 56, lng: 10 },
  { name: "Greece", lat: 39, lng: 22 },
  { name: "Czech Republic", lat: 50, lng: 16 },
  { name: "Hungary", lat: 47, lng: 19 },
  { name: "Romania", lat: 46, lng: 25 },
  { name: "Ukraine", lat: 49, lng: 32 },
  { name: "Russia", lat: 60, lng: 100 },

  // Africa
  { name: "Egypt", lat: 27, lng: 30 },
  { name: "Nigeria", lat: 10, lng: 8 },
  { name: "South Africa", lat: -29, lng: 25 },
  { name: "Kenya", lat: -1, lng: 37 },
  { name: "Ethiopia", lat: 9, lng: 40 },
  { name: "Tanzania", lat: -6, lng: 35 },
  { name: "Ghana", lat: 8, lng: -1 },
  { name: "Morocco", lat: 32, lng: -5 },
  { name: "Algeria", lat: 28, lng: 2 },
  { name: "Sudan", lat: 15, lng: 32 },
  { name: "Angola", lat: -12, lng: 18 },
  { name: "Mozambique", lat: -18, lng: 35 },

  // Middle East
  { name: "Saudi Arabia", lat: 24, lng: 45 },
  { name: "Turkey", lat: 39, lng: 35 },
  { name: "Iran", lat: 32, lng: 53 },
  { name: "Iraq", lat: 33, lng: 44 },
  { name: "Israel", lat: 31, lng: 35 },
  { name: "Jordan", lat: 31, lng: 36 },
  { name: "UAE", lat: 24, lng: 54 },
  { name: "Syria", lat: 35, lng: 38 },
  { name: "Yemen", lat: 16, lng: 48 },

  // Asia
  { name: "China", lat: 35, lng: 105 },
  { name: "Japan", lat: 36, lng: 138 },
  { name: "South Korea", lat: 36, lng: 128 },
  { name: "India", lat: 20, lng: 78 },
  { name: "Pakistan", lat: 30, lng: 70 },
  { name: "Bangladesh", lat: 24, lng: 90 },
  { name: "Thailand", lat: 15, lng: 100 },
  { name: "Vietnam", lat: 16, lng: 108 },
  { name: "Indonesia", lat: -5, lng: 120 },
  { name: "Philippines", lat: 13, lng: 122 },
  { name: "Malaysia", lat: 4, lng: 108 },
  { name: "Myanmar", lat: 20, lng: 96 },
  { name: "Afghanistan", lat: 33, lng: 65 },
  { name: "Kazakhstan", lat: 48, lng: 68 },
  { name: "Uzbekistan", lat: 41, lng: 64 },
  { name: "Nepal", lat: 28, lng: 84 },
  { name: "Sri Lanka", lat: 8, lng: 81 },
  { name: "Cambodia", lat: 12, lng: 105 },

  // Oceania
  { name: "Australia", lat: -27, lng: 133 },
  { name: "New Zealand", lat: -41, lng: 174 },
  { name: "Papua New Guinea", lat: -6, lng: 144 },
];
