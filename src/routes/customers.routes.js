const express = require('express');
const router = express.Router();
const Customer = require('../models/customer.model');

router.get('/', async (req, res) => {
  const customers = await Customer.findAll();
  res.json(customers);
});

module.exports = router;