const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');

// Middleware to ensure user is a CUSTOMER
const customerMiddleware = async (req, res, next) => {
    if (req.user.role !== 'CUSTOMER') {
        return res.status(403).json({ message: 'Access denied. Customer portal only.' });
    }
    next();
};

// Get Invoices for the logged-in Customer
router.get('/invoices', authMiddleware, customerMiddleware, async (req, res) => {
  try {
    // Find the Client entity linked to this User
    const clientProfile = await prisma.client.findUnique({
        where: { portalUserId: req.user.id }
    });

    if (!clientProfile) {
        return res.status(404).json({ message: 'Client profile not found.' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { clientId: clientProfile.id },
      orderBy: { issueDate: 'desc' },
      include: { 
        user: { 
          include: { settings: true } 
        },
        client: true 
      }
    });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

router.post('/pay/:id', authMiddleware, customerMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify invoice belongs to this client
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.client.portalUserId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: 'paid' }
    });

    res.json({ message: 'Payment successful', invoice: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});

module.exports = router;
