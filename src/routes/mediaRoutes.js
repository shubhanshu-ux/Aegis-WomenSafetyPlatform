const express = require('express');
const mediaController = require('../controllers/mediaController');
const { requireAuth } = require('../middleware/auth');
const { emergencyUpload } = require('../middleware/upload');

const router = express.Router();

router.post(
  '/emergency',
  requireAuth,
  emergencyUpload.single('file'),
  mediaController.uploadRecording
);

router.get('/recordings', requireAuth, mediaController.listRecordings);

module.exports = router;
