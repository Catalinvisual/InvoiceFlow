const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// Get Settings for the authenticated user
router.get('/', authMiddleware, settingsController.getSettings);

// Update or Create Settings
router.put('/', authMiddleware, settingsController.updateSettings);

// Save Payment Settings
router.post('/payment', authMiddleware, settingsController.savePaymentSettings);
// Get Payment Settings
router.get('/payment', authMiddleware, settingsController.getPaymentSettings);

// Update Plan
router.put('/plan', authMiddleware, settingsController.updatePlan);

module.exports = router;
