const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');

const uploadController = require('../controllers/upload.controller');

// store uploads in system tmp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post('/upload-customers', upload.single('file'), uploadController.uploadCustomers);
router.post('/upload-orders', upload.single('file'), uploadController.uploadOrders);

module.exports = router;
