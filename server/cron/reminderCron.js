const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

const startCron = () => {
  // Rulează în fiecare zi la ora 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running Advanced Invoice Reminder Job...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all pending invoices with their user settings
      // We only care about pending invoices
      const pendingInvoices = await prisma.invoice.findMany({
        where: {
          status: 'pending',
        },
        include: {
          client: true,
          user: {
            include: {
              settings: true
            }
          }
        },
      });

      console.log(`Processing ${pendingInvoices.length} pending invoices for reminders...`);

      for (const invoice of pendingInvoices) {
        const user = invoice.user;
        const settings = user.settings;

        // Skip if no settings or Free plan (manual only)
        if (!settings || user.plan === 'FREE') continue;

        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        // Calculate days difference: (Today - DueDate)
        // If today is before due date, diff is negative.
        // If today is due date, diff is 0.
        // If today is after due date, diff is positive.
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let shouldSend = false;
        let reminderType = '';

        // Check Logic based on Plan
        if (user.plan === 'PRO') {
            // PRO: Before, On Due, After (1, 2, 3)
            
            // 1. Before Due Date
            if (settings.reminderDaysBefore && diffDays === -settings.reminderDaysBefore) {
                shouldSend = true;
                reminderType = 'before_due';
            }
            
            // 2. On Due Date
            else if (settings.reminderOnDueDate && diffDays === 0) {
                shouldSend = true;
                reminderType = 'on_due';
            }
        }

        // STARTER & PRO: After Due Date
        if (settings.reminderDaysAfter1 && diffDays === settings.reminderDaysAfter1) {
            shouldSend = true;
            reminderType = 'after_1';
        }
        
        // PRO Only: After 2 & 3
        if (user.plan && user.plan.toUpperCase() === 'PRO') {
            if (settings.reminderDaysAfter2 && diffDays === settings.reminderDaysAfter2) {
                shouldSend = true;
                reminderType = 'after_2';
            }
            else if (settings.reminderDaysAfter3 && diffDays === settings.reminderDaysAfter3) {
                shouldSend = true;
                reminderType = 'after_3';
            }
        }

        if (shouldSend && reminderType) {
            // Check if we already sent THIS type of reminder for THIS invoice
            const alreadySent = await prisma.invoiceReminder.findFirst({
                where: {
                    invoiceId: invoice.id,
                    type: reminderType
                }
            });

            if (!alreadySent) {
                console.log(`Sending ${reminderType} reminder for Invoice ${invoice.invoiceNumber} (User: ${user.companyName})`);
                
                await emailService.sendInvoiceReminder(invoice.client.email, invoice, reminderType);
                
                await prisma.invoiceReminder.create({
                    data: {
                        invoiceId: invoice.id,
                        type: reminderType,
                        status: 'sent'
                    }
                });
            }
        }
      }
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
};

module.exports = startCron;
