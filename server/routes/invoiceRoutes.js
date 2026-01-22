// Adaugă endpoint-ul de send email în invoiceRoutes.js
// Voi modifica întregul fișier pentru a include acest endpoint nou și pentru a mă asigura că totul e consistent

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');

// Public Invoice Route (No Auth)
router.get('/public/:id', invoiceController.getPublicInvoice);

// Create Invoice
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { clientId, invoiceNumber, issueDate, dueDate, items, total, amount, vatRate, paymentTerms, notes } = req.body;

    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: req.user.id },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    let invoiceItems = items;
    let subtotalAmount = total ?? amount;

    if (!invoiceItems && subtotalAmount != null) {
      invoiceItems = [{ description: 'Services', quantity: 1, price: parseFloat(subtotalAmount) }];
    }

    if (Array.isArray(invoiceItems)) {
      subtotalAmount = invoiceItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
      invoiceItems = JSON.stringify(invoiceItems);
    } else if (typeof invoiceItems === 'string') {
      invoiceItems = invoiceItems;
      if (subtotalAmount != null) subtotalAmount = parseFloat(subtotalAmount);
    } else {
      invoiceItems = '[]';
      subtotalAmount = subtotalAmount != null ? parseFloat(subtotalAmount) : 0;
    }

    const vatRateVal = vatRate ? parseFloat(vatRate) : 0;
    const vatAmountVal = subtotalAmount * (vatRateVal / 100);
    const finalTotal = subtotalAmount + vatAmountVal;

    const normalizedInvoiceNumber = typeof invoiceNumber === 'string' ? invoiceNumber.trim() : '';
    const isManualInvoiceNumber = normalizedInvoiceNumber.length > 0;

    let finalInvoiceNumber = normalizedInvoiceNumber;
    if (!finalInvoiceNumber) {
      const currentYear = new Date().getFullYear();
      const prefix = `INV-${currentYear}-`;
      
      const existingNumbers = await prisma.invoice.findMany({
        where: { 
          userId: req.user.id,
          invoiceNumber: {
            startsWith: prefix
          }
        },
        select: { invoiceNumber: true },
      });

      // Helper to extract numeric part
      const extractNumber = (str) => {
          const match = str.match(/-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
      };

      const maxNumber = existingNumbers.reduce((max, row) => {
        const n = extractNumber(row.invoiceNumber);
        return Number.isFinite(n) ? Math.max(max, n) : max;
      }, 0);
      
      const nextNum = maxNumber + 1;
      const padded = String(nextNum).padStart(4, '0');
      finalInvoiceNumber = `${prefix}${padded}`;
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
    const paymentLink = currentUser?.paymentLinkBase 
        ? `${currentUser.paymentLinkBase}${currentUser.paymentLinkBase.includes('?') ? '&' : '?'}invoice=${finalInvoiceNumber}`
        : null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const invoice = await prisma.invoice.create({
          data: {
            userId: req.user.id,
            clientId,
            invoiceNumber: finalInvoiceNumber,
            issueDate: new Date(issueDate),
            dueDate: new Date(dueDate),
            paymentTerms,
            items: invoiceItems,
            subtotal: subtotalAmount,
            vatRate: vatRateVal,
            vatAmount: vatAmountVal,
            total: finalTotal,
            status: 'pending',
            paymentLink: paymentLink,
            notes: notes || null
          },
        });
        return res.status(201).json(invoice);
      } catch (error) {
        const isUniqueConflict =
          typeof error?.code === 'string' && error.code === 'P2002';

        if (!isUniqueConflict) {
          throw error;
        }

        if (isManualInvoiceNumber) {
          return res.status(400).json({ message: 'Numărul facturii există deja.' });
        }

        const currentYear = new Date().getFullYear();
        const prefix = `INV-${currentYear}-`;

        const existingNumbers = await prisma.invoice.findMany({
          where: { 
            userId: req.user.id,
            invoiceNumber: {
              startsWith: prefix
            }
          },
          select: { invoiceNumber: true },
        });

        // Helper to extract numeric part
        const extractNumber = (str) => {
            const match = str.match(/-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        };

        const maxNumber = existingNumbers.reduce((max, row) => {
          const n = extractNumber(row.invoiceNumber);
          return Number.isFinite(n) ? Math.max(max, n) : max;
        }, 0);
        
        const nextNum = maxNumber + 1;
        const padded = String(nextNum).padStart(4, '0');
        finalInvoiceNumber = `${prefix}${padded}`;
      }
    }

    return res.status(409).json({ message: 'Could not generate a unique invoice number' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
});

// Get All / Filtered Invoices
router.get('/', authMiddleware, invoiceController.getInvoices);

router.get('/next-number', authMiddleware, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    const existingNumbers = await prisma.invoice.findMany({
      where: { 
        userId: req.user.id,
        invoiceNumber: {
          startsWith: prefix
        }
      },
      select: { invoiceNumber: true },
    });

    // Helper to extract numeric part from "INV-YYYY-001"
    const extractNumber = (str) => {
        const match = str.match(/-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    };

    const maxNumber = existingNumbers.reduce((max, row) => {
      const n = extractNumber(row.invoiceNumber);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0);

    // Format: INV-YYYY-000X
    const nextNum = maxNumber + 1;
    const padded = String(nextNum).padStart(4, '0');
    const nextInvoiceNumber = `${prefix}${padded}`;

    res.json({ nextInvoiceNumber });
  } catch (error) {
    res.status(500).json({ message: 'Error getting next invoice number', error: error.message });
  }
});

// Export Invoices (CSV)
router.get('/export', authMiddleware, async (req, res) => {
  console.log('Export route hit by user:', req.user.email);
  try {
    if (!req.user.plan || req.user.plan.toUpperCase() !== 'PRO') {
      return res.status(403).json({ message: 'Export feature is available only on Pro Plan.' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.id },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });

    if (invoices.length === 0) {
      console.log('No invoices found for export');
      return res.status(400).json({ message: 'No invoices to export.' });
    }

    // Generate CSV
    const headers = ["Invoice Number", "Client", "Issue Date", "Due Date", "Status", "Total", "Currency"];
    const csvRows = invoices.map(inv => {
      const issueDate = inv.issueDate.toISOString().split('T')[0];
      const dueDate = inv.dueDate.toISOString().split('T')[0];
      // Escape quotes in client name
      const clientName = inv.client.name.replace(/"/g, '""');
      
      return [
        inv.invoiceNumber,
        `"${clientName}"`,
        issueDate,
        dueDate,
        inv.status,
        inv.total,
        "EUR"
      ].join(',');
    });

    const csvContent = headers.join(',') + '\n' + csvRows.join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="invoices_export.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting invoices', error: error.message });
  }
});

// Get Single Invoice
router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id },
        include: { client: true },
      });
  
      if (!invoice || invoice.userId !== req.user.id) {
          return res.status(404).json({ message: 'Invoice not found' });
      }
  
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching invoice', error: error.message });
    }
});

// Update Invoice
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
        
        if (!invoice || invoice.userId !== req.user.id) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const updatedInvoice = await prisma.invoice.update({
            where: { id: req.params.id },
            data: { status },
        });

        res.json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ message: 'Error updating invoice', error: error.message });
    }
});

// Mark Invoice as Paid
router.patch('/:id/mark-paid', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { 
        status: 'paid',
        paidAt: new Date()
      }
    });

    res.json({ message: 'Invoice marked as paid', invoice: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
});

// Delete Invoice
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
        if (!invoice || invoice.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });

        await prisma.invoice.delete({ where: { id: req.params.id } });
        res.json({ message: 'Invoice deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting invoice', error: error.message });
    }
});

// Send Invoice Email
router.post('/:id/send', authMiddleware, async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { client: true, user: true }
        });

        if (!invoice || invoice.userId !== req.user.id) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (!invoice.client.email) {
            return res.status(400).json({ message: 'Client has no email address' });
        }

        // Get user settings for PDF generation
        let settings = await prisma.settings.findUnique({ where: { userId: req.user.id } });

        if (!settings) {
            settings = {
                companyName: req.user.companyName,
                email: req.user.email,
                invoiceTemplate: 'simple'
            };
        } else {
             if (!settings.companyName) settings.companyName = req.user.companyName;
             if (!settings.email) settings.email = req.user.email;
        }

        // Generate PDF
        const pdfBytes = await pdfService.generateInvoicePDF(invoice, settings);

        // Send friendly email with PDF attachment
        await emailService.sendInvoiceEmail(invoice.client.email, invoice, pdfBytes, req.user.companyName);

        // Log action in reminders
        await prisma.invoiceReminder.create({
            data: {
                invoiceId: invoice.id,
                type: 'manual',
                status: 'sent'
            }
        });

        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending email', error: error.message });
    }
});

module.exports = router;
