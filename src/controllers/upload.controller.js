const fs = require('fs');
const path = require('path');
const UploadService = require('../services/upload.service');

async function cleanupFile(filePath) {
  try {
    if (filePath) await fs.promises.unlink(filePath);
  } catch (err) {
    // ignore
  }
}

exports.uploadCustomers = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'file is required (multipart/form-data with field `file`)' });

  try {
    const result = await UploadService.processCustomerCSV(file.path);
    res.json(result);
  } catch (err) {
    console.error('uploadCustomers error', err);
    res.status(400).json({ error: err.message || 'Failed to process customers CSV' });
  } finally {
    await cleanupFile(file.path);
  }
};

exports.uploadOrders = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'file is required (multipart/form-data with field `file`)' });

  try {
    const result = await UploadService.processOrderCSV(file.path);
    res.json(result);
  } catch (err) {
    console.error('uploadOrders error', err);
    res.status(400).json({ error: err.message || 'Failed to process orders CSV' });
  } finally {
    await cleanupFile(file.path);
  }
};
