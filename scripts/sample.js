// scripts/create-sample.js
require('dotenv').config();
const { sequelize, Customer, Order, Campaign, CommunicationLog } = require('../src/models');
(async () => {
  await sequelize.authenticate();
  // create a customer
  const c = await Customer.create({ name: 'Acme', email: 'acme@example.com', city: 'NY' });
  const o = await Order.create({ customerId: c.id, amount: 123.45 });
  const camp = await Campaign.create({ name: 'Spring Sale', segmentCriteria: { city: 'NY' }, message: 'Hello', channel: 'email', status: 'active' });
  const log = await CommunicationLog.create({ campaignId: camp.id, customerId: c.id, status: 'SENT' });
  console.log({ c, o, camp, log });
  process.exit(0);
})();