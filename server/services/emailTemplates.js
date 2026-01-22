const mainStyle = `
  background-color: #f6f9fc;
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif;
  margin: 0;
  padding: 20px 0 48px;
`;

const containerStyle = `
  background-color: #ffffff;
  margin: 0 auto;
  max-width: 600px;
  padding: 20px 0 48px;
  margin-bottom: 64px;
`;

const boxStyle = `
  padding: 0 48px;
`;

const h1Style = `
  color: #333;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin: 30px 0;
`;

const textStyle = `
  color: #525f7f;
  font-size: 16px;
  line-height: 24px;
  text-align: left;
`;

const codeBoxStyle = `
  background: #f4f4f4;
  border-radius: 4px;
  margin: 16px 0;
  padding: 16px;
  text-align: center;
`;

const codeStyle = `
  color: #000;
  display: inline-block;
  font-family: monospace;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 6px;
  line-height: 40px;
  padding-bottom: 8px;
  padding-top: 8px;
  margin: 0 auto;
  width: 100%;
  text-align: center;
`;

const hrStyle = `
  border-color: #e6ebf1;
  margin: 20px 0;
  border-top: 1px solid #eaeaea;
`;

const footerStyle = `
  color: #8898aa;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
`;

const buttonStyle = `
  background-color: #007ee6;
  border-radius: 4px;
  color: #fff;
  font-size: 16px;
  text-decoration: none;
  text-align: center;
  display: block;
  width: 100%;
  padding: 12px;
  margin: 24px 0;
`;

const baseHtml = (content) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
  </head>
  <body style="${mainStyle}">
    <div style="${containerStyle}">
      <div style="${boxStyle}">
        ${content}
      </div>
    </div>
  </body>
</html>
`;

exports.getActivationEmailHtml = (code) => {
  const content = `
    <h1 style="${h1Style}">Welcome!</h1>
    <p style="${textStyle}">
      Thank you for registering. To complete your account setup, please use the following activation code:
    </p>
    <div style="${codeBoxStyle}">
      <p style="${codeStyle}">${code}</p>
    </div>
    <p style="${textStyle}">
      If you didn't request this code, you can safely ignore this email.
    </p>
    <hr style="${hrStyle}" />
    <p style="${footerStyle}">
      SaaS Application Team
    </p>
  `;
  return baseHtml(content);
};

exports.getDashboardAnnouncementHtml = (subject, message) => {
  const content = `
    <h1 style="${h1Style}; text-align: left;">${subject}</h1>
    <p style="${textStyle}; white-space: pre-wrap;">${message}</p>
    <hr style="${hrStyle}" />
    <p style="${footerStyle}">
      SaaS Application Team
    </p>
  `;
  return baseHtml(content);
};

exports.getNewsletterHtml = (title, contentBody) => {
  const content = `
    <h1 style="${h1Style}">${title}</h1>
    <p style="${textStyle}; white-space: pre-wrap;">${contentBody}</p>
    <hr style="${hrStyle}" />
    <p style="${footerStyle}">
      SaaS Application Team<br />
      You are receiving this email because you subscribed to our newsletter.
    </p>
  `;
  return baseHtml(content);
};

exports.getInvoiceEmailHtml = (senderName, invoiceNumber, amount, currency, downloadLink, paymentLink, paymentInstructions) => {
  const content = `
    <h1 style="${h1Style}">Invoice from ${senderName}</h1>
    <p style="${textStyle}">Hello,</p>
    <p style="${textStyle}">
      Please find attached invoice ${invoiceNumber}.<br/>
      Amount: ${amount} ${currency}
    </p>
    
    ${paymentLink ? `
    <p style="${textStyle}">
      <strong>Pay online:</strong>
    </p>
    <a href="${paymentLink}" style="${buttonStyle}" target="_blank" rel="noopener noreferrer">
      Pay now
    </a>
    ` : ''}

    ${paymentInstructions ? `
    <p style="${textStyle}">
      <strong>Payment Instructions:</strong><br/>
      <span style="white-space: pre-wrap;">${paymentInstructions}</span>
    </p>
    ` : ''}

    ${downloadLink ? `<a href="${downloadLink}" style="${buttonStyle}">View Invoice</a>` : ''}
    
    <p style="${textStyle}">
      Thank you.
    </p>
    <hr style="${hrStyle}" />
    <p style="${footerStyle}">
      Sent by ${senderName} via SaaS Application
    </p>
  `;
  return baseHtml(content);
};

exports.getInvoiceReminderHtml = (invoiceNumber, total, type) => {
    let subject = `Reminder: Invoice #${invoiceNumber}`;
    let text = `Just a reminder about invoice #${invoiceNumber}.`;
    
    switch (type) {
        case 'before_due':
            subject = `Upcoming Due Date: Invoice #${invoiceNumber}`;
            text = `This is a friendly reminder that invoice #${invoiceNumber} for ${total} is due soon.`;
            break;
        case 'on_due':
            subject = `Due Today: Invoice #${invoiceNumber}`;
            text = `Invoice #${invoiceNumber} for ${total} is due today. Please make payment at your earliest convenience.`;
            break;
        case 'after_1':
            subject = `Overdue: Invoice #${invoiceNumber}`;
            text = `We noticed that invoice #${invoiceNumber} for ${total} is now overdue. Please send payment as soon as possible.`;
            break;
        case 'after_2':
            subject = `Payment Reminder: Invoice #${invoiceNumber}`;
            text = `This is a second reminder that invoice #${invoiceNumber} is outstanding.`;
            break;
        case 'after_3':
            subject = `Urgent: Invoice #${invoiceNumber} Overdue`;
            text = `Please be advised that invoice #${invoiceNumber} is significantly overdue. Immediate payment is requested.`;
            break;
    }

    const content = `
      <h1 style="${h1Style}">${subject}</h1>
      <p style="${textStyle}">${text}</p>
      <hr style="${hrStyle}" />
      <p style="${footerStyle}">
        SaaS Application Team
      </p>
    `;
    return { subject, html: baseHtml(content) };
};
