const prisma = require('../prismaClient');
const emailService = require('../services/emailService');

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    const [activeInvoices, paidInvoices, overdueInvoices, totalClients, recentInvoices] = await Promise.all([
      prisma.invoice.count({ where: { userId: req.user.id, status: 'pending' } }),
      prisma.invoice.count({ where: { userId: req.user.id, status: 'paid' } }),
      prisma.invoice.count({
        where: {
          userId: req.user.id,
          OR: [{ status: 'overdue' }, { status: 'pending', dueDate: { lt: now } }],
        },
      }),
      prisma.client.count({ where: { userId: req.user.id } }),
      prisma.invoice.findMany({
        where: { userId: req.user.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { name: true } } }
      })
    ]);

    const [totalOutstandingAgg, totalRecoveredAgg, totalOverdueAgg] = await Promise.all([
      prisma.invoice.aggregate({
        where: { userId: req.user.id, status: 'pending' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { userId: req.user.id, status: 'paid' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          userId: req.user.id,
          OR: [{ status: 'overdue' }, { status: 'pending', dueDate: { lt: now } }],
        },
        _sum: { total: true },
      }),
    ]);

    // RESTRICTION: Only PRO plan sees financial totals (Cashflow)
    const isPro = req.user.plan && req.user.plan.toUpperCase() === 'PRO';
    
    res.json({
      counts: {
        activeInvoices,
        paidInvoices,
        overdueInvoices,
      },
      totalClients,
      recentInvoices: recentInvoices.map(inv => ({
        ...inv,
        total: Number(inv.total).toFixed(2), // Ensure total is formatted if needed, or keep as is
      })),
      totals: isPro ? {
        outstanding: totalOutstandingAgg._sum.total || 0,
        recovered: totalRecoveredAgg._sum.total || 0,
        overdue: totalOverdueAgg._sum.total || 0,
      } : null, // Hide totals for non-Pro
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
};

exports.sendAnnouncement = async (req, res) => {
    const { subject, message } = req.body;
    
    if (!subject || !message) {
        return res.status(400).json({ message: 'Subject and message are required' });
    }

    try {
        const clients = await prisma.client.findMany({
            where: { userId: req.user.id },
            select: { email: true }
        });

        // Filter clients with email
        const emails = clients.map(c => c.email).filter(email => email);

        if (emails.length === 0) {
            return res.status(400).json({ message: 'No clients with email addresses found.' });
        }

        await emailService.sendDashboardAnnouncement(emails, subject, message);
        
        res.json({ message: `Announcement sent to ${emails.length} clients` });
    } catch (error) {
        res.status(500).json({ message: 'Error sending announcement', error: error.message });
    }
};
