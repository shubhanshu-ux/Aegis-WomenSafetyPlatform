const express = require('express');
const travelController = require('../controllers/travelController');
const { requireAuth } = require('../middleware/auth');
const { driverUpload } = require('../middleware/upload');

const router = express.Router();

router.post(
  '/trips',
  requireAuth,
  driverUpload.single('driverImage'),
  travelController.createTrip
);

router.get('/trips', requireAuth, travelController.listMyTrips);

module.exports = router;
