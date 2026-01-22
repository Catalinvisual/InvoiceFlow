import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Button,
} from '@react-email/components';

interface InvoiceEmailProps {
  senderName: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  downloadLink?: string;
}

export const InvoiceEmail = ({
  senderName,
  invoiceNumber,
  amount,
  currency,
  downloadLink,
}: InvoiceEmailProps) => (
  <Html>
    <Head />
    <Preview>Invoice {invoiceNumber} from {senderName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Invoice from {senderName}</Heading>
          <Text style={text}>
            Hello,
          </Text>
          <Text style={text}>
            Please find attached the invoice {invoiceNumber} for {amount} {currency}.
          </Text>
          {downloadLink && (
            <Section style={buttonContainer}>
              <Button style={button} href={downloadLink}>
                View Invoice
              </Button>
            </Section>
          )}
          <Text style={text}>
            Thank you for your business!
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Sent by {senderName} via SaaS Application
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
};

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};

export default InvoiceEmail;
