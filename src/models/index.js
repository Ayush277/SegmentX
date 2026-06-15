const sequelize = require('../config/database');

const User = require('./user.model');
const Customer = require('./customer.model');
const Order = require('./order.model');
const Campaign = require('./campaign.model');
const CommunicationLog = require('./communicationLog.model');

// Associations
Customer.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Campaign.hasMany(CommunicationLog, { foreignKey: 'campaignId', as: 'logs' });
CommunicationLog.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

Customer.hasMany(CommunicationLog, { foreignKey: 'customerId', as: 'communicationLogs' });
CommunicationLog.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

module.exports = {
  sequelize,
  User,
  Customer,
  Order,
  Campaign,
  CommunicationLog
};
