const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analytics.controller');

// GET /api/analytics/campaign-analytics/:campaignId
router.get('/campaign-analytics/:campaignId', AnalyticsController.getCampaignAnalytics);

module.exports = router;
