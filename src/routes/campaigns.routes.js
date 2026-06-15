const express = require('express');
const router = express.Router();
const CampaignsController = require('../controllers/campaigns.controller');

// POST /api/campaigns/create-campaign
router.post('/create-campaign', CampaignsController.createCampaign);

module.exports = router;
