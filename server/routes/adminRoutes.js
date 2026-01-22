const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const authMiddleware = require('../middleware/auth');
const emailService = require('../services/emailService');

const adminMiddleware = async (req, res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// GET /api/admin/stats - Dashboard Overview
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const vendorsCount = await prisma.user.count({ where: { role: 'VENDOR' } });
    const customersCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const subscribersCount = await prisma.newsletterSubscriber.count({ where: { isActive: true } });
    const totalInvoices = await prisma.invoice.count();
    
    // Plan Distribution
    const freePlan = await prisma.user.count({ where: { role: 'VENDOR', plan: 'FREE' } });
    const starterPlan = await prisma.user.count({ where: { role: 'VENDOR', plan: 'STARTER' } });
    const proPlan = await prisma.user.count({ where: { role: 'VENDOR', plan: 'PRO' } });

    // Recent Signups (last 5 vendors with paid plans)
    const recentUsers = await prisma.user.findMany({
        where: { 
            role: 'VENDOR',
            plan: { not: 'FREE' } 
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, companyName: true, email: true, createdAt: true, plan: true }
    });

    const recentSubscribers = await prisma.newsletterSubscriber.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    // Calculate simulated revenue (e.g. number of vendors * subscription price)
    // For MVP, just hardcode or use a simple multiplier
    // Free: 0, Starter: 10, Pro: 30
    const revenue = (starterPlan * 10) + (proPlan * 30); 

    res.json({ 
        vendors: vendorsCount, 
        customers: customersCount,
        subscribers: subscribersCount,
        revenue,
        totalInvoices,
        planDistribution: {
            FREE: freePlan,
            STARTER: starterPlan,
            PRO: proPlan
        },
        recentUsers,
        recentSubscribers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

router.post('/broadcast', authMiddleware, adminMiddleware, async (req, res) => {
    const { subject, message, type } = req.body; // type: 'all' | 'newsletter'
    try {
        let emails = [];
        let target = '';

        if (type === 'newsletter') {
            const subscribers = await prisma.newsletterSubscriber.findMany({ 
                where: { isActive: true },
                select: { email: true }
            });
            emails = subscribers.map(s => s.email);
            target = 'Newsletter Subscribers';
        } else {
            const users = await prisma.user.findMany({ 
                where: { role: 'VENDOR' },
                select: { email: true }
            });
            emails = users.map(u => u.email);
            target = 'Platform Users';
        }

        if (emails.length === 0) {
            return res.status(400).json({ message: 'No recipients found' });
        }

        console.log(`[BROADCAST] Sending to ${emails.length} ${target}: ${subject}`);
        
        const { results, errors } = await emailService.sendDashboardAnnouncement(emails, subject, message);

        if (errors.length > 0 && results.length === 0) {
             // All failed
             console.error('Broadcast failed for all recipients:', JSON.stringify(errors, null, 2));
             return res.status(500).json({ 
                 message: 'Failed to send broadcast to any recipients', 
                 details: errors 
             });
        }

        if (errors.length > 0) {
             // Partial success
             return res.status(200).json({ 
                 message: `Broadcast sent to ${results.length} users. Failed for ${errors.length} users.`,
                 warning: true,
                 results, 
                 errors 
             });
        }

        res.json({ message: `Broadcast sent successfully to ${results.length} ${target}.` });
    } catch (error) {
        console.error('Broadcast Error:', error);
         // Extract the most relevant error message
         const errorMessage = error.message || 'Error sending broadcast';
         const errorDetails = error.response?.data || error;
         res.status(500).json({ message: errorMessage, error: errorMessage, details: errorDetails });
    }
});

// GET /api/admin/users - List Users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'VENDOR' },
      select: { 
        id: true, 
        email: true, 
        companyName: true, 
        plan: true, 
        createdAt: true,
        _count: {
          select: { invoices: true, clients: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// PUT /api/admin/users/:id - Update User Details
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { plan, companyName, email } = req.body;
  
  const updateData = {};

  if (plan) {
    if (!['FREE', 'STARTER', 'PRO'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan' });
    }
    updateData.plan = plan;
    updateData.subscriptionStatus = 'ACTIVE';
    updateData.subscriptionPlan = plan.toLowerCase();
  }

  if (companyName !== undefined) updateData.companyName = companyName;
  if (email !== undefined) updateData.email = email;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete User
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    // Perform deletion in a transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
        // 1. Unlink if this user is a Portal User for any Client
        await tx.client.updateMany({
            where: { portalUserId: userId },
            data: { portalUserId: null }
        });

        // 2. Delete related records owned by this user (if they are a Vendor)
        
        // Delete Settings
        await tx.settings.deleteMany({ where: { userId } });
        
        // Delete Email Verifications
        await tx.emailVerification.deleteMany({ where: { userId } });
        
        // Delete Custom Templates
        await tx.customTemplate.deleteMany({ where: { userId } });

        // Delete Invoices (Reminders will cascade delete because of onDelete: Cascade in schema)
        await tx.invoice.deleteMany({ where: { userId } });

        // Delete Clients owned by this user
        await tx.client.deleteMany({ where: { userId } });

        // 3. Finally delete the User
        await tx.user.delete({ where: { id: userId } });
    });

    res.json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    // Provide more specific error info
    const errorMessage = error instanceof PrismaClient.PrismaClientKnownRequestError 
        ? `Database error: ${error.code} - ${error.meta?.cause || error.message}`
        : error.message;
        
    res.status(500).json({ 
        message: 'Error deleting user. Ensure all related data is handled.', 
        error: errorMessage,
        details: error 
    });
  }
});

// GET /api/admin/revenue - Detailed Revenue Data
router.get('/revenue', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Get all vendors to calculate revenue projection
    const users = await prisma.user.findMany({
      where: { role: 'VENDOR' },
      select: { id: true, email: true, companyName: true, plan: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    // Simulate "Recent Transactions" based on user signups/renewals
    // Real app would query a 'Payment' or 'Subscription' table
    const transactions = users.map(user => {
      let amount = 0;
      if (user.plan === 'STARTER') amount = 19;
      if (user.plan === 'PRO') amount = 49;
      
      return {
        id: user.id,
        user: user.companyName || user.email,
        plan: user.plan,
        amount: amount,
        date: user.createdAt, // Using creation date as "last payment" for MVP
        status: 'Paid'
      };
    }).filter(t => t.amount > 0);

    res.json({
      transactions,
      totalRevenue: transactions.reduce((acc, curr) => acc + curr.amount, 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching revenue', error: error.message });
  }
});

// GET /api/admin/subscribers - List Subscribers
router.get('/subscribers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscribers', error: error.message });
  }
});

module.exports = router;
