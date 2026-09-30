const { createDemoProvider } = require('./demoProvider');

// Demo adapter. To go live, replace search() with a call to ixigo's partner
// API and map each result to the Offer shape documented in demoProvider.js.
module.exports = createDemoProvider({
  id: 'ixigo',
  name: 'ixigo',
  color: '#fc790d',
  website: 'https://www.ixigo.com/buses',
  coverage: 0.68,
  priceBias: 1.0,
  discountChance: 0.5,
  discountPct: [6, 16],
  maxDiscount: 275,
  offerCodes: ['IXIBUS', 'IXISAVE'],
  latencyMs: [350, 1000],
  bookingUrl: () => 'https://www.ixigo.com/buses',
});
