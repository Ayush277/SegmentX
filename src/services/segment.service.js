const { Customer, Order, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get customer IDs matching segment rules.
 * rules: { min_spend?: number, city?: string, max_inactive_days?: number }
 * Returns: { ids: number[], count: number }
 */
async function getSegmentCustomers(rules = {}) {
  const where = {};
  if (rules.city) where.city = rules.city;

  const attributes = [
    'id',
    // total_spent: sum of orders.amount (treat null as 0)
    [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('orders.amount')), 0), 'total_spent'],
    [sequelize.fn('MAX', sequelize.col('orders.date')), 'last_order_date']
  ];

  // left join orders so customers without orders are included
const include = [
  {
    model: Order,
    as: 'orders',
    attributes: [],
    required: false
  }
];

  const group = ['Customer.id'];

  const havingClauses = [];

  if (typeof rules.min_spend === 'number') {
    // SUM(orders.amount) >= min_spend (treat NULL as 0)
    havingClauses.push(sequelize.where(sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('orders.amount')), 0), '>=', rules.min_spend));
  }

  if (typeof rules.max_inactive_days === 'number') {
    const threshold = new Date(Date.now() - rules.max_inactive_days * 24 * 60 * 60 * 1000);
    // include customers whose last order is NULL (never ordered) OR last_order_date <= threshold
    // We construct a raw literal for the OR condition for portability.
    const iso = threshold.toISOString();
    havingClauses.push(sequelize.literal(`(MAX("orders"."date") IS NULL OR MAX("orders"."date") <= '${iso}')`));
  }

  const options = {
    where,
    attributes,
    include,
    group,
    raw: true
  };

  if (havingClauses.length) {
    // combine clauses with AND
    options.having = havingClauses.length === 1 ? havingClauses[0] : sequelize.and(...havingClauses);
  }

  const rows = await Customer.findAll(options);

  const ids = rows.map(r => r.id);
  return { ids, count: ids.length };
}

module.exports = {
  getSegmentCustomers
};
