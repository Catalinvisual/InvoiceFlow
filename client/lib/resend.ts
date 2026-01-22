import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || 're_123456789';
export const resend = new Resend(resendApiKey);
