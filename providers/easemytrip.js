const { createDemoProvider } = require('./demoProvider');

// Demo adapter. To go live, replace search() with a call to EaseMyTrip's partner
// API and map each result to the Offer shape documented in demoProvider.js.
module.exports = createDemoProvider({
  id: 'easemytrip',
  name: 'EaseMyTrip',
  color: '#2196f3',
  website: 'https://www.easemytrip.com/bus/',
  coverage: 0.65,
  priceBias: 0.98,
  discountChance: 0.6,
  discountPct: [5, 14],
  maxDiscount: 250,
  offerCodes: ['EMTBUS', 'EMTSAVE'],
  latencyMs: [400, 1000],
  bookingUrl: () => 'https://www.easemytrip.com/bus/',
});
