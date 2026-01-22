const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

router.get('/stats', authMiddleware, dashboardController.getDashboardStats);
router.post('/announcement', authMiddleware, dashboardController.sendAnnouncement);

module.exports = router;
