const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const prisma = require('../prismaClient');

exports.sendInvoice = async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, client: { userId: req.user.id } },
      include: { 
        client: true,
        user: true
      },
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    if (!invoice.client.email) {
      return res.status(400).json({ message: 'Client has no email address' });
    }

    let settings = await prisma.settings.findUnique({ where: { userId: req.user.id } });
    if (!settings) {
      settings = {
        companyName: req.user.companyName,
        email: req.user.email,
        invoiceTemplate: 'simple',
        currency: 'EUR'
      };
    } else {
      if (!settings.companyName) settings.companyName = req.user.companyName;
      if (!settings.email) settings.email = req.user.email;
    }

    const pdfBytes = await pdfService.generateInvoicePDF(invoice, settings);
    await emailService.sendInvoiceEmail(invoice.client.email, invoice, pdfBytes, req.user.companyName);

    // Log reminder
    await prisma.invoiceReminder.create({
      data: {
        invoiceId: invoice.id,
        type: 'manual', // Manual send
        status: 'sent',
      }
    });

    res.json({ message: 'Invoice sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending invoice', error: error.message });
  }
};

exports.exportInvoices = async (req, res) => {
  try {
    const user = req.user;
    if (!user.plan || user.plan.toUpperCase() !== 'PRO') {
      return res.status(403).json({ message: 'Export feature is available only on Pro Plan.' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: user.id },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });

    if (invoices.length === 0) {
      return res.status(404).json({ message: 'No invoices to export.' });
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
        "EUR" // Assuming EUR for now as per schema default
      ].join(',');
    });

    const csvContent = headers.join(',') + '\n' + csvRows.join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="invoices_export.csv"');
    res.send(csvContent);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Error exporting invoices', error: error.message });
  }
};


exports.getInvoices = async (req, res) => {
  try {
    const { status, q, clientId, year } = req.query;
    const where = {
      client: { userId: req.user.id },
    };

    if (status) {
      where.status = String(status).toUpperCase();
    }

    if (clientId && clientId !== 'all') {
      where.clientId = clientId;
    }

    if (year && year !== 'all') {
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      where.issueDate = {
        gte: startDate,
        lte: endDate
      };
    }

    if (q) {
      const search = String(q).trim();
      const isNumeric = /^[0-9]+$/.test(search);

      if (isNumeric) {
        where.OR = [
          { invoiceNumber: { endsWith: search } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
        ];
      } else {
        where.OR = [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
};

exports.createInvoice = async (req, res) => {
  const { clientId, invoiceNumber, amount, issueDate, dueDate, items, paymentTerms, notes } = req.body;
  try {
    const user = req.user;

    // 1. Check Plan Limits (Invoices)
    if (user.plan === 'FREE') {
        const count = await prisma.invoice.count({ where: { userId: user.id } });
        if (count >= 3) {
            return res.status(403).json({ 
                message: 'Free Plan limit reached (3 invoices). Please upgrade to create more.' 
            });
        }
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: req.user.id }
    });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Handle items and total
    let invoiceItems = items;
    let totalAmount = amount;

    if (!invoiceItems && amount) {
      // Legacy support: create single item from amount
      invoiceItems = JSON.stringify([{ description: 'Services', quantity: 1, price: parseFloat(amount) }]);
      totalAmount = parseFloat(amount);
    } else if (Array.isArray(invoiceItems)) {
        // Calculate total from items if provided
        totalAmount = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        invoiceItems = JSON.stringify(invoiceItems);
    }

    // Calculate Due Date if Payment Terms provided
    let finalDueDate = new Date(dueDate);
    if (paymentTerms) {
        const issue = new Date(issueDate);
        if (paymentTerms === 'Net 7') {
            finalDueDate = new Date(issue.setDate(issue.getDate() + 7));
        } else if (paymentTerms === 'Net 14') {
            finalDueDate = new Date(issue.setDate(issue.getDate() + 14));
        } else if (paymentTerms === 'Net 30') {
            finalDueDate = new Date(issue.setDate(issue.getDate() + 30));
        }
    }

    const invoice = await prisma.invoice.create({
      data: {
        userId: req.user.id,
        clientId,
        invoiceNumber,
        items: invoiceItems || '[]',
        total: totalAmount || 0,
        issueDate: new Date(issueDate),
        dueDate: finalDueDate,
        paymentTerms,
        notes,
        status: 'pending'
      }
    });
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
};

exports.updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    // Verify ownership via client
    const invoice = await prisma.invoice.findFirst({
      where: { id, client: { userId: req.user.id } }
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: String(status).toLowerCase() }
    });
    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
};

exports.getInvoiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, client: { userId: req.user.id } },
      include: { client: true, reminders: true },
    });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
};

exports.getPublicInvoice = async (req, res) => {
  const { id } = req.params;
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { 
        client: true, 
        user: {
          select: {
            companyName: true,
            cui: true,
            regCom: true,
            address: true,
            city: true,
            country: true,
            iban: true,
            bank: true,
            email: true,
            phone: true,
            paymentMethod: true,
            paymentLinkBase: true,
            paymentInstructions: true,
            settings: true // Include settings for logo, etc.
          }
        }
      }
    });

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Sanitize sensitive user data if needed (already selected safe fields)
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching public invoice', error: error.message });
  }
};

exports.exportInvoicesCsv = async (req, res) => {
  try {
    if (req.user.plan !== 'PRO') {
      return res.status(403).json({ message: 'Export to CSV is available only on Pro plan.' });
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId: req.user.id },
      include: { client: true },
      orderBy: { issueDate: 'desc' }
    });

    const fields = ['Invoice Number', 'Client Name', 'Issue Date', 'Due Date', 'Total', 'Status'];
    const csvRows = invoices.map(inv => {
      return [
        inv.invoiceNumber,
        inv.client.name,
        new Date(inv.issueDate).toISOString().split('T')[0],
        new Date(inv.dueDate).toISOString().split('T')[0],
        inv.total,
        inv.status
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); 
    });

    const csvContent = [fields.join(',')].concat(csvRows).join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('invoices.csv');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting CSV', error: error.message });
  }
};
