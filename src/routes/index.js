const express = require('express');
const router = express.Router();

router.use('/users', require('./users.routes'));
router.use('/health', require('./health.routes'));
router.use('/upload', require('./upload.routes'));
router.use('/segments', require('./segments.routes'));
router.use('/customers', require('./customers.routes'));
router.use('/campaigns', require('./campaigns.routes'));
router.use('/analytics', require('./analytics.routes'));
// AI endpoints (generate drafts)
router.use('/', require('./ai.routes'));

module.exports = router;
