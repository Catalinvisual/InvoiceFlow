import { resend } from './resend';
import ActivationEmail from '@/components/emails/ActivationEmail';
import DashboardAnnouncementEmail from '@/components/emails/DashboardAnnouncementEmail';
import NewsletterEmail from '@/components/emails/NewsletterEmail';
import InvoiceEmail from '@/components/emails/InvoiceEmail';

const DEFAULT_SENDER = 'onboarding@resend.dev';

export const sendActivationEmail = async (email: string, code: string) => {
  try {
    const data = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: email,
      subject: 'Activate your account',
      react: ActivationEmail({ activationCode: code }),
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending activation email:', error);
    return { success: false, error };
  }
};

export const sendDashboardAnnouncement = async (emails: string[], subject: string, message: string) => {
  try {
    // sending in batches of 100 max per request is recommended by Resend if using batch
    // simplified here to loop or single batch if small
    // using batch API
    const emailBatch = emails.map((email) => ({
      from: DEFAULT_SENDER,
      to: email,
      subject: subject,
      react: DashboardAnnouncementEmail({ subject, message }),
    }));

    // Resend batch has a limit of 100. For production, chunking is needed.
    // For now, assuming small list or implementing simple chunking.
    const chunkSize = 100;
    const results = [];
    
    for (let i = 0; i < emailBatch.length; i += chunkSize) {
        const batch = emailBatch.slice(i, i + chunkSize);
        const data = await resend.batch.send(batch);
        results.push(data);
    }

    return { success: true, data: results };
  } catch (error) {
    console.error('Error sending announcement:', error);
    return { success: false, error };
  }
};

export const sendNewsletter = async (emails: string[], title: string, content: string) => {
  try {
    const emailBatch = emails.map((email) => ({
      from: DEFAULT_SENDER,
      to: email,
      subject: title,
      react: NewsletterEmail({ title, content }),
    }));

    const chunkSize = 100;
    const results = [];
    
    for (let i = 0; i < emailBatch.length; i += chunkSize) {
        const batch = emailBatch.slice(i, i + chunkSize);
        const data = await resend.batch.send(batch);
        results.push(data);
    }

    return { success: true, data: results };
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return { success: false, error };
  }
};

export const sendInvoice = async (
  to: string,
  senderName: string,
  invoiceDetails: {
    invoiceNumber: string;
    amount: string;
    currency: string;
    downloadLink?: string;
  }
) => {
  try {
    const data = await resend.emails.send({
      from: `${senderName} <${DEFAULT_SENDER}>`, // Trying to set sender name, though domain must match
      to: to,
      subject: `Invoice ${invoiceDetails.invoiceNumber} from ${senderName}`,
      react: InvoiceEmail({
        senderName,
        invoiceNumber: invoiceDetails.invoiceNumber,
        amount: invoiceDetails.amount,
        currency: invoiceDetails.currency,
        downloadLink: invoiceDetails.downloadLink,
      }),
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending invoice:', error);
    return { success: false, error };
  }
};
