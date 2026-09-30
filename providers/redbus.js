const { createDemoProvider } = require('./demoProvider');

const citySlug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Demo adapter. To go live, replace search() with a call to redBus's partner
// API and map each result to the Offer shape documented in demoProvider.js.
module.exports = createDemoProvider({
  id: 'redbus',
  name: 'redBus',
  color: '#d84e55',
  website: 'https://www.redbus.in',
  coverage: 0.92,
  priceBias: 1.02,
  discountChance: 0.55,
  discountPct: [5, 15],
  maxDiscount: 250,
  offerCodes: ['FIRST', 'RBSAVE', 'WEEKEND'],
  latencyMs: [350, 900],
  bookingUrl: (q) => `https://www.redbus.in/bus-tickets/${citySlug(q.from)}-to-${citySlug(q.to)}`,
});
