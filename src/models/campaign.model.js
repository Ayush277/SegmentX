const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  segmentCriteria: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'segment_criteria'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  channel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'draft'
  }
}, {
  tableName: 'campaigns',
  timestamps: true
});

module.exports = Campaign;
