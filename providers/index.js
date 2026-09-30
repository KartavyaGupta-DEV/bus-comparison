const PROVIDERS = [
  require('./redbus'),
  require('./abhibus'),
  require('./makemytrip'),
  require('./intrcity'),
  require('./goibibo'),
  require('./cleartrip'),
  require('./flixbus'),
  require('./easemytrip'),
  require('./paytm'),
  require('./ixigo'),
];

const PROVIDER_TIMEOUT_MS = 8000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function queryProvider(provider, query) {
  const started = Date.now();
  try {
    const offers = await withTimeout(provider.search(query), PROVIDER_TIMEOUT_MS);
    return { provider, offers, status: 'ok', ms: Date.now() - started };
  } catch (err) {
    return { provider, offers: [], status: 'error', error: err.message, ms: Date.now() - started };
  }
}

async function searchAll(query) {
  const results = await Promise.all(PROVIDERS.map((p) => queryProvider(p, query)));
  const byBus = new Map();

  for (const { provider, offers } of results) {
    for (const offer of offers) {
      if (query.departAfterMin != null && offer.departureMin < query.departAfterMin) continue;
      if (offer.seatsAvailable < query.seats) continue;

      if (!byBus.has(offer.busId)) {
        byBus.set(offer.busId, {
          id: offer.busId,
          operator: offer.operator,
          busType: offer.busType,
          ac: offer.ac,
          sleeper: offer.sleeper,
          departureMin: offer.departureMin,
          durationMin: offer.durationMin,
          rating: offer.rating,
          amenities: offer.amenities,
          offers: [],
        });
      }

      byBus.get(offer.busId).offers.push({
        providerId: provider.id,
        providerName: provider.name,
        color: provider.color,
        basePrice: offer.basePrice,
        discount: offer.discount,
        finalPrice: offer.finalPrice,
        totalPrice: offer.finalPrice * query.seats,
        offerCode: offer.offerCode,
        seatsAvailable: offer.seatsAvailable,
        bookingUrl: offer.bookingUrl,
      });
    }
  }

  const buses = [...byBus.values()].map((bus) => {
    bus.offers.sort((a, b) => a.finalPrice - b.finalPrice);
    const best = bus.offers[0];
    const worst = bus.offers[bus.offers.length - 1];
    return { ...bus, bestProviderId: best.providerId, bestPrice: best.finalPrice, savings: worst.finalPrice - best.finalPrice };
  });
  buses.sort((a, b) => a.bestPrice - b.bestPrice);

  const wins = {};
  for (const bus of buses) wins[bus.bestProviderId] = (wins[bus.bestProviderId] || 0) + 1;

  return {
    providers: results.map(({ provider, offers, status, error, ms }) => ({
      id: provider.id,
      name: provider.name,
      color: provider.color,
      website: provider.website,
      mode: provider.mode,
      status,
      error,
      resultCount: offers.length,
      ms,
      bestDeals: wins[provider.id] || 0,
    })),
    buses,
  };
}

module.exports = { PROVIDERS, searchAll };
