const CITIES = [
  { name: 'Delhi', lat: 28.61, lon: 77.21 },
  { name: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'Bangalore', lat: 12.97, lon: 77.59 },
  { name: 'Chennai', lat: 13.08, lon: 80.27 },
  { name: 'Hyderabad', lat: 17.39, lon: 78.49 },
  { name: 'Pune', lat: 18.52, lon: 73.86 },
  { name: 'Kolkata', lat: 22.57, lon: 88.36 },
  { name: 'Ahmedabad', lat: 23.02, lon: 72.57 },
  { name: 'Jaipur', lat: 26.91, lon: 75.79 },
  { name: 'Lucknow', lat: 26.85, lon: 80.95 },
  { name: 'Chandigarh', lat: 30.73, lon: 76.78 },
  { name: 'Goa', lat: 15.49, lon: 73.83 },
  { name: 'Indore', lat: 22.72, lon: 75.86 },
  { name: 'Bhopal', lat: 23.26, lon: 77.41 },
  { name: 'Nagpur', lat: 21.15, lon: 79.09 },
  { name: 'Coimbatore', lat: 11.02, lon: 76.96 },
  { name: 'Kochi', lat: 9.93, lon: 76.27 },
  { name: 'Mysore', lat: 12.3, lon: 76.64 },
  { name: 'Vijayawada', lat: 16.51, lon: 80.65 },
  { name: 'Visakhapatnam', lat: 17.69, lon: 83.22 },
  { name: 'Manali', lat: 32.24, lon: 77.19 },
  { name: 'Dehradun', lat: 30.32, lon: 78.03 },
  { name: 'Agra', lat: 27.18, lon: 78.01 },
  { name: 'Varanasi', lat: 25.32, lon: 82.97 },
  { name: 'Surat', lat: 21.17, lon: 72.83 },
  { name: 'Udaipur', lat: 24.59, lon: 73.71 },
  { name: 'Madurai', lat: 9.93, lon: 78.12 },
  { name: 'Mangalore', lat: 12.91, lon: 74.86 },
  { name: 'Shimla', lat: 31.1, lon: 77.17 },
  { name: 'Amritsar', lat: 31.63, lon: 74.87 },
  { name: 'Hardoi', lat: 27.4, lon: 80.13 },
];

const ALIASES = {
  bengaluru: 'bangalore',
  'new delhi': 'delhi',
  bombay: 'mumbai',
  madras: 'chennai',
  calcutta: 'kolkata',
  vizag: 'visakhapatnam',
  mysuru: 'mysore',
  mangaluru: 'mangalore',
  cochin: 'kochi',
  panaji: 'goa',
};

function normalizeCity(name) {
  const key = String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return ALIASES[key] || key;
}

function findCity(name) {
  const key = normalizeCity(name);
  return CITIES.find((c) => c.name.toLowerCase() === key) || null;
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

module.exports = { CITIES, normalizeCity, findCity, haversineKm };
