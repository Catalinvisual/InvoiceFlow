const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const authMiddleware = require('../middleware/auth');

// Public route
router.post('/subscribe', newsletterController.subscribe);
router.post('/unsubscribe', newsletterController.unsubscribe);

// Admin routes (should be protected, handled in admin routes or here with middleware)
// For simplicity, keeping basic CRUD here, but "send" logic might be separate or here.
// Let's expose GET here for admin use (protected)
router.get('/', authMiddleware, newsletterController.getAllSubscribers);
router.post('/send', authMiddleware, newsletterController.sendNewsletter);

module.exports = router;
