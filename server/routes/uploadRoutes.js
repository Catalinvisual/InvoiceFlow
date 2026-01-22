const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');

// POST /api/upload/logo
router.post('/logo', auth, uploadController.uploadLogo);

// POST /api/upload/clients
router.post('/clients', auth, uploadController.uploadClients);

module.exports = router;
