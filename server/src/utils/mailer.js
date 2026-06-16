import nodemailer from 'nodemailer';

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    console.log(`Mailer: Using SMTP configuration from environment: ${host}:${port}`);
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === '465',
      auth: { user, pass }
    });
  } else {
    console.log('Mailer: No SMTP environment variables found. Generating Ethereal test mailer account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`Mailer: Ethereal SMTP test account created (User: ${testAccount.user})`);
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      console.warn('Mailer: Failed to create Ethereal SMTP test account. Falling back to log-only transport.', err.message);
      // Fallback log transporter
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('\n--- [MOCK MAIL SENT] ---');
          console.log(`To: ${mailOptions.to}`);
          console.log(`Subject: ${mailOptions.subject}`);
          console.log(`Body (Text): \n${mailOptions.text}`);
          console.log(`Body (HTML): \n${mailOptions.html}`);
          console.log('-------------------------\n');
          return { messageId: 'mock-id-' + Date.now() };
        }
      };
    }
  }

  return transporter;
};

export const sendMail = async ({ to, subject, text, html }) => {
  try {
    const client = await getTransporter();
    const info = await client.sendMail({
      from: '"Asset Management App" <no-reply@assetmanagement.local>',
      to,
      subject,
      text,
      html
    });

    console.log(`Email sent successfully. Message ID: ${info.messageId}`);
    
    // If using Ethereal, print test URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw error;
  }
};
export default sendMail;
