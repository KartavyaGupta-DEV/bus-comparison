const { buildInventory, hashString, seededRandom, normalizeCity } = require('./inventory');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round10 = (n) => Math.round(n / 10) * 10;

/**
 * Builds a provider that returns deterministic demo offers.
 * Every provider (demo or live) must expose:
 *   { id, name, color, website, search(query) -> Promise<Offer[]> }
 * where Offer = { busId, operator, busType, ac, sleeper, departureMin, durationMin,
 *   rating, amenities, basePrice, discount, finalPrice, offerCode, seatsAvailable, bookingUrl }
 */
function createDemoProvider(config) {
  const {
    id,
    name,
    color,
    website,
    coverage,
    priceBias,
    discountChance,
    discountPct,
    maxDiscount,
    offerCodes,
    latencyMs,
    bookingUrl,
    operatorBoost = [],
  } = config;

  async function search(query) {
    await sleep(latencyMs[0] + Math.random() * (latencyMs[1] - latencyMs[0]));

    const { buses } = buildInventory(query);
    const routeKey = `${id}|${normalizeCity(query.from)}>${normalizeCity(query.to)}|${query.date}`;
    const offers = [];

    for (const bus of buses) {
      const rand = seededRandom(hashString(`${routeKey}|${bus.id}`));
      const boosted = operatorBoost.includes(bus.operator);
      if (!boosted && rand() > coverage) continue;

      const basePrice = round10(bus.baseFare * (priceBias + (rand() - 0.5) * 0.08));
      let discount = 0;
      let offerCode = null;
      if (boosted || rand() < discountChance) {
        const pct = discountPct[0] + rand() * (discountPct[1] - discountPct[0]);
        discount = Math.min(maxDiscount, Math.round((basePrice * pct) / 100));
        offerCode = offerCodes[Math.floor(rand() * offerCodes.length)];
      }

      offers.push({
        busId: bus.id,
        operator: bus.operator,
        busType: bus.busType,
        ac: bus.ac,
        sleeper: bus.sleeper,
        departureMin: bus.departureMin,
        durationMin: bus.durationMin,
        rating: bus.rating,
        amenities: bus.amenities,
        basePrice,
        discount,
        finalPrice: basePrice - discount,
        offerCode,
        seatsAvailable: Math.floor(bus.totalSeats * (0.05 + rand() * 0.75)),
        bookingUrl: bookingUrl(query),
      });
    }

    return offers;
  }

  return { id, name, color, website, mode: 'demo', search };
}

module.exports = { createDemoProvider };
