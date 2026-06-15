const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommunicationLog = sequelize.define('CommunicationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'campaigns', key: 'id' },
    field: 'campaign_id'
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'customers', key: 'id' },
    field: 'customer_id'
  },
  status: {
    type: DataTypes.ENUM('SENT','DELIVERED','OPENED','CLICKED'),
    allowNull: false,
    defaultValue: 'SENT'
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'communication_logs',
  timestamps: false
});

module.exports = CommunicationLog;
