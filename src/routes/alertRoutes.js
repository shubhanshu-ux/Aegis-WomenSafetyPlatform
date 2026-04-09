const express = require('express');
const alertController = require('../controllers/alertController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/active', requireAuth, alertController.getMyActiveAlert);
router.get('/', requireAuth, alertController.listOpenAlerts);
router.post('/', requireAuth, alertController.createAlert);
router.get('/mine', requireAuth, alertController.myAlerts);
router.get('/nearby', requireAuth, alertController.nearbyAlerts);

router.post('/:id/resolve', requireAuth, alertController.resolveAlert);
router.post('/:id/accept', requireAuth, alertController.acceptAlert);

// 🔥 FIXED LINE
router.put('/cancel/:id', requireAuth, alertController.cancelByVolunteer);

module.exports = router;
