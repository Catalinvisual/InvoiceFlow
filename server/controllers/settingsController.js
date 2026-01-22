const prisma = require('../prismaClient');

exports.getSettings = async (req, res) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { userId: req.user.id }
    });
    if (!settings) {
        // Create default settings if not exists
        settings = await prisma.settings.create({
            data: { userId: req.user.id }
        });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  const { 
      companyName, cui, regCom, address, city, country, zipCode, 
      iban, bank, swift, email, phone, website,
      logoUrl, brandColor, invoiceTemplate, currency,
      reminderDaysAfter1, reminderDaysAfter2, reminderDaysAfter3, reminderDaysBefore, reminderOnDueDate,
      templateConfig
  } = req.body;

  const user = req.user;

  try {
    // Check Branding Restriction (Free & Starter cannot set brandColor or logoUrl)
    if ((brandColor || logoUrl) && (user.plan === 'FREE' || user.plan === 'STARTER')) {
        return res.status(403).json({ 
            message: 'Custom branding (Logo, Colors) is only available on Pro Plan.' 
        });
    }

    // Check Template Restriction (Free Plan limited to 3 templates)
    if (invoiceTemplate && user.plan && user.plan.toUpperCase() === 'FREE') {
        const ALLOWED_TEMPLATES_FREE = ['simple', 'minimalist', 'modern'];
        if (!ALLOWED_TEMPLATES_FREE.includes(invoiceTemplate)) {
            return res.status(403).json({
                message: 'Your plan only allows access to Basic templates (Simple, Minimalist, Modern). Upgrade to access all templates.'
            });
        }
    }

    // Check Template Customization Restriction (Pro Only)
    if (templateConfig && (!user.plan || user.plan.toUpperCase() !== 'PRO')) {
        return res.status(403).json({
            message: 'Advanced invoice customization is only available on the Pro Plan.'
        });
    }

    // Check Reminder Automation Restrictions
    if (user.plan && user.plan.toUpperCase() === 'FREE') {
        // Free plan now includes 1 basic auto-reminder (we'll assume reminderDaysAfter1)
        if (reminderDaysBefore || reminderOnDueDate || reminderDaysAfter2 || reminderDaysAfter3) {
            return res.status(403).json({
                message: 'Free plan allows only 1 basic reminder (after due date). Upgrade to Pro for advanced automation.'
            });
        }
    } else if (user.plan && user.plan.toUpperCase() === 'STARTER') {
        if (reminderDaysBefore || reminderOnDueDate || reminderDaysAfter2 || reminderDaysAfter3) {
             return res.status(403).json({
                message: 'Starter plan allows only 1 basic reminder (after due date). Upgrade to Pro for advanced automation (before/on due date).'
            });
        }
    }

    const settings = await prisma.settings.upsert({
      where: { userId: req.user.id },
      update: { 
          companyName, cui, regCom, address, city, country, zipCode, 
          iban, bank, swift, email, phone, website,
          logoUrl: (user.plan && user.plan.toUpperCase() === 'PRO') ? logoUrl : undefined,
          brandColor: (user.plan && user.plan.toUpperCase() === 'PRO') ? brandColor : undefined,
          invoiceTemplate, currency,
          reminderDaysAfter1, reminderDaysAfter2, reminderDaysAfter3, reminderDaysBefore, reminderOnDueDate,
          templateConfig: (user.plan && user.plan.toUpperCase() === 'PRO') ? templateConfig : undefined
      },
      create: { 
          userId: req.user.id, 
          companyName, cui, regCom, address, city, country, zipCode, 
          iban, bank, swift, email, phone, website,
          brandColor, invoiceTemplate, currency,
          reminderDaysAfter1, reminderDaysAfter2, reminderDaysAfter3, reminderDaysBefore, reminderOnDueDate,
          templateConfig: (user.plan && user.plan.toUpperCase() === 'PRO') ? templateConfig : undefined
      }
    });

    // Update user company name as well if changed
    if (companyName) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { companyName },
      });
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

exports.savePaymentSettings = async (req, res) => {
  const { payment_method, payment_link_base, payment_instructions } = req.body;
  
  try {
    // Validate URL if present
    if (payment_link_base) {
      try {
        new URL(payment_link_base);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid Payment Link URL format.' });
      }
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        paymentMethod: payment_method,
        paymentLinkBase: payment_link_base,
        paymentInstructions: payment_instructions
      }
    });

    res.json({ message: 'Payment settings saved successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving payment settings', error: error.message });
  }
};

exports.getPaymentSettings = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        paymentMethod: true,
        paymentLinkBase: true,
        paymentInstructions: true
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment settings', error: error.message });
  }
};

exports.updatePlan = async (req, res) => {
  let { plan } = req.body;
  if (plan) plan = plan.toUpperCase();
  
  if (!['FREE', 'STARTER', 'PRO'].includes(plan)) {
    return res.status(400).json({ message: 'Invalid plan selected.' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { plan }
    });
    
    res.json({ message: `Plan updated to ${plan}`, plan: user.plan });
  } catch (error) {
    res.status(500).json({ message: 'Error updating plan', error: error.message });
  }
};
