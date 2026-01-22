const { Resend } = require('resend');
const emailTemplates = require('./emailTemplates');

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = 'onboarding@resend.dev'; // Use verified domain in production

exports.sendInvoiceEmail = async (to, invoice, pdfBytes, senderName) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('Mock Email Sent to:', to);
    console.log('Subject: Invoice', invoice.invoiceNumber);
    return;
  }

  const from = senderName ? `${senderName} <${DEFAULT_FROM}>` : DEFAULT_FROM;
  const subject = `Invoice ${invoice.invoiceNumber} from ${senderName || 'My Company'}`;
  
  // Assuming EUR or parsing from invoice if available
  const currency = 'EUR'; 
  const amount = invoice.total;
  const paymentLink = invoice.paymentLink;
  const paymentInstructions = invoice.user?.paymentInstructions || invoice.user?.settings?.paymentInstructions; // Fallback if settings has it (unlikely per new schema)

  const html = emailTemplates.getInvoiceEmailHtml(
      senderName || 'My Company', 
      invoice.invoiceNumber, 
      amount, 
      currency, 
      null, 
      paymentLink, 
      paymentInstructions
  );

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments: [
        {
          content: Buffer.from(pdfBytes),
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment', // Resend uses 'content_id' for inline, but standard attachments are auto-detected usually or passed as buffer
          // Resend Node SDK expects content as buffer or base64 string? 
          // Resend docs: content: Buffer | string
        },
      ],
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    // Don't throw to avoid crashing the request, just log
  }
};

exports.sendVerificationEmail = async (to, code) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('Mock Verification Email Sent to:', to);
    console.log('Verification code:', code);
    return;
  }

  const html = emailTemplates.getActivationEmailHtml(code);

  try {
    console.log('Sending verification email via Resend to:', to);
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: 'Activate your account',
      html,
    });

    if (error) {
      console.error('Error returned by Resend when sending verification email:', error);
      throw new Error(error.message || 'Failed to send verification email');
    }

    console.log('Verification email accepted by Resend:', { to, id: data?.id });
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

exports.sendInvoiceReminder = async (to, invoice, type = 'manual') => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`Mock Reminder (${type}) Sent to:`, to);
    return;
  }

  const { subject, html } = emailTemplates.getInvoiceReminderHtml(invoice.invoiceNumber, invoice.total, type);

  try {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Error sending reminder email:', error);
  }
};

exports.sendDashboardAnnouncement = async (emails, subject, message) => {
    if (!process.env.RESEND_API_KEY) {
        console.log('Mock Announcement to:', emails.length, 'recipients');
        return;
    }

    const html = emailTemplates.getDashboardAnnouncementHtml(subject, message);

    // Send individually to handle errors better and avoid batch limits on free tier
    const results = [];
    const errors = [];

    for (const email of emails) {
        try {
            console.log(`Sending announcement to ${email}...`);
            const { data, error } = await resend.emails.send({
                from: DEFAULT_FROM,
                to: email,
                subject,
                html
            });

            if (error) {
                console.error(`Failed to send to ${email}:`, error);
                errors.push({ email, error });
            } else {
                console.log(`Success sending to ${email}:`, data);
                results.push({ email, data });
            }
        } catch (err) {
            console.error(`Exception sending to ${email}:`, err);
            errors.push({ email, error: err.message });
        }
    }

    // Return detailed results instead of throwing, so the controller can handle partial failures
    return { results, errors };
};

exports.sendNewsletter = async (emails, title, content) => {
    if (!process.env.RESEND_API_KEY) {
        console.log('Mock Newsletter to:', emails.length, 'recipients');
        return;
    }
    
    console.log(`Starting newsletter send. API Key present: ${!!process.env.RESEND_API_KEY}. Length: ${process.env.RESEND_API_KEY?.length}`);

    const html = emailTemplates.getNewsletterHtml(title, content);

    const payloads = emails.map(email => ({
        from: DEFAULT_FROM,
        to: email,
        subject: title,
        html
    }));

    const batchSize = 100;

    try {
        // Send individually to handle errors better and avoid batch limits on free tier
        const results = [];
        const errors = [];

        for (const email of emails) {
            try {
                console.log(`Sending newsletter to ${email}...`);
                const { data, error } = await resend.emails.send({
                    from: DEFAULT_FROM,
                    to: email,
                    subject: title,
                    html
                });

                if (error) {
                    console.error(`Failed to send to ${email}:`, error);
                    errors.push({ email, error });
                } else {
                    console.log(`Success sending to ${email}:`, data);
                    results.push({ email, data });
                }
            } catch (err) {
                console.error(`Exception sending to ${email}:`, err);
                errors.push({ email, error: err.message });
            }
        }

        if (errors.length > 0 && results.length === 0) {
            // If ALL failed, throw the first error
            const firstError = errors[0];
            throw new Error(`Failed to send email to ${firstError.email}: ${JSON.stringify(firstError.error)}`);
        }

        return { results, errors };

    } catch (error) {
        console.error('Service Error sending newsletter:', error);
        throw error;
    }
};
