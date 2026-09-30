const { createDemoProvider } = require('./demoProvider');

// Demo adapter. To go live, replace search() with a call to AbhiBus's partner
// API and map each result to the Offer shape documented in demoProvider.js.
module.exports = createDemoProvider({
  id: 'abhibus',
  name: 'AbhiBus',
  color: '#f36f21',
  website: 'https://www.abhibus.com',
  coverage: 0.72,
  priceBias: 0.99,
  discountChance: 0.65,
  discountPct: [8, 20],
  maxDiscount: 300,
  offerCodes: ['ABHI10', 'NEWUSER', 'SAVEMORE'],
  latencyMs: [400, 1100],
  bookingUrl: () => 'https://www.abhibus.com/',
});
