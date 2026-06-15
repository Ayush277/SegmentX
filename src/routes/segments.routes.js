const express = require('express');
const router = express.Router();
const segmentsController = require('../controllers/segments.controller');

// Parse natural language into JSON rules
router.post('/parse', segmentsController.parse);

// Run segmentation: accept either { text } (natural language) or { rules }
router.post('/run', segmentsController.run);

module.exports = router;
