const prisma = require('../prismaClient');

exports.getTemplates = async (req, res) => {
  try {
    const templates = await prisma.customTemplate.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching custom templates', error: error.message });
  }
};

exports.getTemplateById = async (req, res) => {
  try {
    const template = await prisma.customTemplate.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching template', error: error.message });
  }
};

exports.createTemplate = async (req, res) => {
  const { name, config } = req.body;
  
  try {
    // Check plan limits if necessary
    if (req.user.plan && req.user.plan.toUpperCase() === 'FREE') {
        // Optional: limit number of custom templates for free users
        // const count = await prisma.customTemplate.count({ where: { userId: req.user.id } });
        // if (count >= 1) return res.status(403).json({ message: 'Free plan limited to 1 custom template.' });
    }

    const template = await prisma.customTemplate.create({
      data: {
        userId: req.user.id,
        name: name || 'Untitled Template',
        config
      }
    });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error creating template', error: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  const { name, config } = req.body;
  
  try {
    const template = await prisma.customTemplate.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const updated = await prisma.customTemplate.update({
      where: { id: req.params.id },
      data: {
        name: name || template.name,
        config: config || template.config
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating template', error: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const template = await prisma.customTemplate.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    await prisma.customTemplate.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting template', error: error.message });
  }
};
