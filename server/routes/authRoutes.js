const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.put('/change-password', authMiddleware, authController.changePassword);
router.put('/update-email', authMiddleware, authController.updateEmail);
router.delete('/delete-account', authMiddleware, authController.deleteAccount);

module.exports = router;
