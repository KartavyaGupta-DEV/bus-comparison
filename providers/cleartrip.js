const { createDemoProvider } = require('./demoProvider');

// Demo adapter. To go live, replace search() with a call to Cleartrip's partner
// API and map each result to the Offer shape documented in demoProvider.js.
module.exports = createDemoProvider({
  id: 'cleartrip',
  name: 'Cleartrip',
  color: '#f77728',
  website: 'https://www.cleartrip.com/bus',
  coverage: 0.6,
  priceBias: 1.01,
  discountChance: 0.45,
  discountPct: [6, 15],
  maxDiscount: 250,
  offerCodes: ['CTBUS', 'CTDEAL'],
  latencyMs: [400, 1100],
  bookingUrl: () => 'https://www.cleartrip.com/bus',
});
