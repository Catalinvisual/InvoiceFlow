const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');

router.use(auth); // Protect all routes

router.get('/', clientController.getClients);
router.post('/', clientController.createClient);
router.post('/invite', clientController.inviteClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;
