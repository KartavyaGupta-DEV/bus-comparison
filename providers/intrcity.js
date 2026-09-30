const { createDemoProvider } = require('./demoProvider');

// Demo adapter. IntrCity sells its own SmartBus fleet plus a smaller set of
// partner operators, so coverage is lower but its own buses are always listed.
module.exports = createDemoProvider({
  id: 'intrcity',
  name: 'IntrCity',
  color: '#6c3fc5',
  website: 'https://www.intrcity.com',
  coverage: 0.45,
  priceBias: 0.97,
  discountChance: 0.4,
  discountPct: [5, 12],
  maxDiscount: 200,
  offerCodes: ['SMART', 'INTR50'],
  latencyMs: [300, 800],
  bookingUrl: () => 'https://www.intrcity.com/',
  operatorBoost: ['IntrCity SmartBus'],
});
