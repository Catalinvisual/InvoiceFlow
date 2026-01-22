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
  Link,
} from '@react-email/components';

interface ActivationEmailProps {
  activationCode: string;
}

export const ActivationEmail = ({ activationCode }: ActivationEmailProps) => (
  <Html>
    <Head />
    <Preview>Activate your account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={h1}>Welcome!</Heading>
          <Text style={text}>
            Thank you for registering. To complete your account setup, please use the following activation code:
          </Text>
          <Section style={codeBox}>
            <Text style={code}>{activationCode}</Text>
          </Section>
          <Text style={text}>
            If you didn't request this code, you can safely ignore this email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            SaaS Application Team
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

const codeBox = {
  background: '#f4f4f4',
  borderRadius: '4px',
  margin: '16px 0',
  padding: '16px',
  textAlign: 'center' as const,
};

const code = {
  color: '#000',
  display: 'inline-block',
  fontFamily: 'monospace',
  fontSize: '32px',
  fontWeight: '700',
  letterSpacing: '6px',
  lineHeight: '40px',
  paddingBottom: '8px',
  paddingTop: '8px',
  margin: '0 auto',
  width: '100%',
  textAlign: 'center' as const,
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

export default ActivationEmail;
