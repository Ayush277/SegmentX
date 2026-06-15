const mongoose = require('mongoose');

const { Schema } = mongoose;

// Customer schema
const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    city: { type: String, trim: true },
  },
  { timestamps: true }
);

// Ensure unique index on email
CustomerSchema.index({ email: 1 }, { unique: true });

// Order schema
const OrderSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Campaign schema
const CampaignSchema = new Schema(
  {
    intent: { type: String, trim: true },
    audienceSize: { type: Number, default: 0 },
    selectedMessage: { type: String },
    status: { type: String, default: 'DRAFT' },
  },
  { timestamps: true }
);

// CommunicationLog schema
const CommunicationLogSchema = new Schema(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    status: {
      type: String,
      enum: ['SENT', 'DELIVERED', 'OPENED', 'CLICKED'],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Customer = mongoose.model('Customer', CustomerSchema);
const Order = mongoose.model('Order', OrderSchema);
const Campaign = mongoose.model('Campaign', CampaignSchema);
const CommunicationLog = mongoose.model('CommunicationLog', CommunicationLogSchema);

module.exports = {
  Customer,
  Order,
  Campaign,
  CommunicationLog,
};
