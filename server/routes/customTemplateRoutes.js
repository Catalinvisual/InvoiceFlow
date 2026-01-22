const express = require('express');
const router = express.Router();
const customTemplateController = require('../controllers/customTemplateController');
const protect = require('../middleware/auth');

router.use(protect);

router.get('/', customTemplateController.getTemplates);
router.post('/', customTemplateController.createTemplate);
router.get('/:id', customTemplateController.getTemplateById);
router.put('/:id', customTemplateController.updateTemplate);
router.delete('/:id', customTemplateController.deleteTemplate);

module.exports = router;
