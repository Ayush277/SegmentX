const fs = require('fs');
const csv = require('csv-parser');
const { Customer, Order, sequelize } = require('../models');

const BATCH_SIZE = 500;

function validateHeaders(headers, required) {
  const lower = headers.map(h => String(h).trim().toLowerCase());
  return required.every(r => lower.includes(r));
}

exports.processCustomerCSV = (filePath) => new Promise((resolve, reject) => {
  const results = [];
  const headersSeen = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('headers', (headers) => {
      headersSeen.push(...headers);
      const ok = validateHeaders(headers, ['name', 'email', 'city']);
      if (!ok) {
        reject(new Error('CSV headers must include: name, email, city'));
      }
    })
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', async () => {
      try {
        if (results.length === 0) return resolve({ inserted: 0 });

        // Normalize and dedupe by email within CSV
        const normalized = results.map(r => ({
          name: (r.name || r.Name || '').trim(),
          email: (r.email || r.Email || '').trim().toLowerCase(),
          city: (r.city || r.City || '').trim()
        })).filter(r => r.email && r.name);

        const uniqueByEmailMap = new Map();
        for (const row of normalized) {
          if (!uniqueByEmailMap.has(row.email)) uniqueByEmailMap.set(row.email, row);
        }

        const emails = Array.from(uniqueByEmailMap.keys());

        // find existing emails in DB
        const existing = await Customer.findAll({ where: { email: emails }, attributes: ['email'] });
        const existingSet = new Set(existing.map(e => e.email));

        // Prepare new customers to insert
        const toInsert = [];
        for (const email of emails) {
          if (!existingSet.has(email)) {
            const r = uniqueByEmailMap.get(email);
            toInsert.push({ name: r.name, email: r.email, city: r.city });
          }
        }

        // Bulk insert in transaction with batching
        let inserted = 0;
        await sequelize.transaction(async (tx) => {
          for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
            const batch = toInsert.slice(i, i + BATCH_SIZE);
            const res = await Customer.bulkCreate(batch, { transaction: tx });
            inserted += res.length;
          }
        });

        resolve({ inserted });
      } catch (err) {
        reject(err);
      }
    })
    .on('error', (err) => reject(err));
});

exports.processOrderCSV = (filePath) => new Promise((resolve, reject) => {
  const results = [];
  const headersSeen = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('headers', (headers) => {
      headersSeen.push(...headers);
      const ok = validateHeaders(headers, ['customer_id', 'amount']);
      if (!ok) {
        reject(new Error('CSV headers must include: customer_id, amount'));
      }
    })
    .on('data', (data) => {
      results.push(data);
    })
    .on('end', async () => {
      try {
        if (results.length === 0) return resolve({ inserted: 0 });

        // Normalize rows
        const normalized = results.map(r => ({
          customerId: Number((r.customer_id || r.customerId || r['Customer ID'] || '').toString().trim()),
          amount: parseFloat((r.amount || r.Amount || '0').toString().trim()),
          date: r.date ? new Date(r.date) : new Date()
        })).filter(r => r.customerId && !Number.isNaN(r.amount));

        // Collect unique customerIds and ensure they exist
        const customerIds = Array.from(new Set(normalized.map(r => r.customerId)));
        const existingCustomers = await Customer.findAll({ where: { id: customerIds }, attributes: ['id'] });
        const existingSet = new Set(existingCustomers.map(c => c.id));

        // Filter rows to only those with existing customer
        const toInsert = normalized.filter(r => existingSet.has(r.customerId)).map(r => ({
          customerId: r.customerId,
          amount: r.amount,
          date: r.date
        }));

        // Bulk insert orders in batches within a transaction
        let inserted = 0;
        await sequelize.transaction(async (tx) => {
          for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
            const batch = toInsert.slice(i, i + BATCH_SIZE);
            const res = await Order.bulkCreate(batch, { transaction: tx });
            inserted += res.length;
          }
        });

        resolve({ inserted });
      } catch (err) {
        reject(err);
      }
    })
    .on('error', (err) => reject(err));
});
