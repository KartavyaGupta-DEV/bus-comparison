// Shared demo inventory: the same physical buses run on a route regardless of
// which platform sells the ticket, so every demo provider reads from this and
// then applies its own coverage, pricing and discounts.
const { normalizeCity, findCity, haversineKm } = require('./cities');

const OPERATORS = [
  'VRL Travels', 'SRS Travels', 'Orange Tours & Travels', 'Zingbus', 'IntrCity SmartBus',
  'KPN Travels', 'Neeta Travels', 'Paulo Travels', 'Hans Travels', 'Jabbar Travels',
  'Kallada Travels', 'Shrinath Travels', 'Chartered Bus', 'National Travels',
  'Parveen Travels', 'NueGo', 'Morning Star Travels', 'Sharma Transports', 'FlixBus',
];

const BUS_TYPES = [
  { name: 'Non-AC Seater (2+2)', perKm: 1.05, seats: 45, ac: false, sleeper: false },
  { name: 'AC Seater (2+2)', perKm: 1.45, seats: 41, ac: true, sleeper: false },
  { name: 'Non-AC Sleeper (2+1)', perKm: 1.35, seats: 36, ac: false, sleeper: true },
  { name: 'AC Sleeper (2+1)', perKm: 1.95, seats: 32, ac: true, sleeper: true },
  { name: 'Volvo Multi-Axle AC Sleeper', perKm: 2.35, seats: 30, ac: true, sleeper: true },
  { name: 'Electric AC Seater (2+2)', perKm: 1.6, seats: 43, ac: true, sleeper: false },
];

const AMENITIES = ['Wi-Fi', 'Charging point', 'Water bottle', 'Blanket', 'Reading light', 'CCTV', 'Live tracking', 'Snacks'];

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function routeDistanceKm(from, to) {
  const a = findCity(from);
  const b = findCity(to);
  if (a && b) return Math.max(60, Math.round(haversineKm(a, b) * 1.25));
  const pair = [normalizeCity(from), normalizeCity(to)].sort().join('|');
  const rand = seededRandom(hashString(pair));
  return Math.round(180 + rand() * 520);
}

const cache = new Map();

function buildInventory({ from, to, date }) {
  const key = `${normalizeCity(from)}>${normalizeCity(to)}|${date}`;
  if (cache.has(key)) return cache.get(key);

  const rand = seededRandom(hashString(key));
  const distanceKm = routeDistanceKm(from, to);
  const count = distanceKm > 1500 ? 5 + Math.floor(rand() * 4) : 14 + Math.floor(rand() * 9);
  const buses = [];

  for (let i = 0; i < count; i++) {
    const operator = pick(rand, OPERATORS);
    const type = pick(rand, BUS_TYPES);
    // Most intercity buses in India run overnight, so bias departures to the evening.
    const nightBus = rand() < 0.55;
    const departureMin = Math.round((nightBus ? 1080 + rand() * 330 : 300 + rand() * 780) / 5) * 5;
    const speedKmh = 48 + rand() * 14;
    const durationMin = Math.max(60, Math.round(((distanceKm / speedKmh) * 60) / 5) * 5);
    const baseFare = Math.max(199, Math.round((distanceKm * type.perKm * (0.9 + rand() * 0.25) + 80) / 10) * 10);
    const amenities = AMENITIES.filter(() => rand() < (type.ac ? 0.6 : 0.3));

    buses.push({
      id: `${slug(operator)}-${departureMin}-${i}`,
      operator,
      busType: type.name,
      ac: type.ac,
      sleeper: type.sleeper,
      totalSeats: type.seats,
      departureMin,
      durationMin,
      baseFare,
      rating: Math.round((3.4 + rand() * 1.5) * 10) / 10,
      amenities,
    });
  }

  buses.sort((a, b) => a.departureMin - b.departureMin);
  const result = { distanceKm, buses };
  if (cache.size > 500) cache.clear();
  cache.set(key, result);
  return result;
}

module.exports = { buildInventory, hashString, seededRandom, normalizeCity };
