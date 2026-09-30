const { createDemoProvider } = require('./demoProvider');

// Demo adapter. FlixBus sells only its own fleet, so it lists few buses overall
// but always lists its own, usually at a low fare.
module.exports = createDemoProvider({
  id: 'flixbus',
  name: 'FlixBus',
  color: '#73d700',
  website: 'https://www.flixbus.in',
  coverage: 0,
  priceBias: 0.92,
  discountChance: 0.35,
  discountPct: [5, 15],
  maxDiscount: 200,
  offerCodes: ['FLIX10', 'FLIXNEW'],
  latencyMs: [300, 900],
  bookingUrl: () => 'https://www.flixbus.in/',
  operatorBoost: ['FlixBus'],
});
