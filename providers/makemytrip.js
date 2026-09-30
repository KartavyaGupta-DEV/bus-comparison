const { createDemoProvider } = require('./demoProvider');

// Demo adapter. To go live, replace search() with a call to MakeMyTrip's
// partner API and map each result to the Offer shape documented in demoProvider.js.
module.exports = createDemoProvider({
  id: 'makemytrip',
  name: 'MakeMyTrip',
  color: '#008cff',
  website: 'https://www.makemytrip.com/bus-tickets/',
  coverage: 0.78,
  priceBias: 1.04,
  discountChance: 0.5,
  discountPct: [10, 22],
  maxDiscount: 400,
  offerCodes: ['MMTBUS', 'MYBUS', 'BUSFEST'],
  latencyMs: [500, 1300],
  bookingUrl: () => 'https://www.makemytrip.com/bus-tickets/',
});
