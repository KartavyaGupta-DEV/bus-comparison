const { createDemoProvider } = require('./demoProvider');

// Demo adapter. To go live, replace search() with a call to Goibibo's partner
// API and map each result to the Offer shape documented in demoProvider.js.
module.exports = createDemoProvider({
  id: 'goibibo',
  name: 'Goibibo',
  color: '#ec5b24',
  website: 'https://www.goibibo.com/bus/',
  coverage: 0.76,
  priceBias: 1.03,
  discountChance: 0.55,
  discountPct: [8, 18],
  maxDiscount: 350,
  offerCodes: ['GOBUS', 'GOSAVE', 'GIFESTIVE'],
  latencyMs: [450, 1200],
  bookingUrl: () => 'https://www.goibibo.com/bus/',
});
