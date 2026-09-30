const { createDemoProvider } = require('./demoProvider');

// Demo adapter. To go live, replace search() with a call to Paytm Travel's
// partner API and map each result to the Offer shape documented in demoProvider.js.
module.exports = createDemoProvider({
  id: 'paytm',
  name: 'Paytm',
  color: '#00baf2',
  website: 'https://tickets.paytm.com/bus/',
  coverage: 0.7,
  priceBias: 1.0,
  discountChance: 0.5,
  discountPct: [5, 20],
  maxDiscount: 300,
  offerCodes: ['PAYTMBUS', 'CASHBACK'],
  latencyMs: [450, 1200],
  bookingUrl: () => 'https://tickets.paytm.com/bus/',
});
