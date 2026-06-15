const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'customers', key: 'id' },
    field: 'customer_id'
  },
  amount: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: false,
    defaultValue: 0
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;
