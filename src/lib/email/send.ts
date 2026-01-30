// Email sending library using Resend
// Configure RESEND_API_KEY in environment variables

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@autolead.ai';
const RESEND_API_URL = 'https://api.resend.com/emails';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text, attachments, replyTo } = params;

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    // Format attachments for Resend API
    const formattedAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
    }));

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        attachments: formattedAttachments,
        reply_to: replyTo,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Resend API error:', errorData);
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      id: data.id,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test Drive Confirmation Email
interface TestDriveConfirmationParams {
  to: string;
  customerName: string;
  vehicleInfo: string;
  scheduledDate: Date | null;
  scheduledTime: string | null;
  salesExecutiveName: string;
  pdfAttachment?: Buffer;
  dealershipName?: string;
  dealershipPhone?: string;
}

export async function sendTestDriveConfirmationEmail(params: TestDriveConfirmationParams): Promise<SendEmailResult> {
  const {
    to,
    customerName,
    vehicleInfo,
    scheduledDate,
    scheduledTime,
    salesExecutiveName,
    pdfAttachment,
    dealershipName = 'AutoLead Dealership',
    dealershipPhone = '+971 4 XXX XXXX',
  } = params;

  const formattedDate = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'TBD';

  const subject = `Test Drive Confirmation - ${vehicleInfo}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
      color: white;
      padding: 30px;
      border-radius: 12px 12px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 12px 12px;
    }
    .greeting {
      font-size: 18px;
      color: #111;
      margin-bottom: 20px;
    }
    .details-card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #6b7280;
      width: 120px;
      flex-shrink: 0;
    }
    .detail-value {
      color: #111;
    }
    .highlight {
      color: #7c3aed;
      font-weight: 600;
    }
    .next-steps {
      margin: 25px 0;
    }
    .next-steps h3 {
      color: #111;
      margin-bottom: 15px;
    }
    .next-steps ul {
      margin: 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 8px 0;
    }
    .cta-button {
      display: inline-block;
      background: #7c3aed;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .contact-info {
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Test Drive Confirmed!</h1>
  </div>

  <div class="content">
    <p class="greeting">Dear ${customerName},</p>

    <p>Thank you for booking a test drive with us. Your appointment has been confirmed!</p>

    <div class="details-card">
      <div class="detail-row">
        <span class="detail-label">Vehicle:</span>
        <span class="detail-value highlight">${vehicleInfo}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date:</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time:</span>
        <span class="detail-value">${scheduledTime || 'TBD'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Consultant:</span>
        <span class="detail-value">${salesExecutiveName}</span>
      </div>
    </div>

    <div class="next-steps">
      <h3>What to Bring</h3>
      <ul>
        <li>Your valid driving license (the one used for verification)</li>
        <li>Emirates ID (if applicable)</li>
      </ul>
    </div>

    <div class="next-steps">
      <h3>What to Expect</h3>
      <ul>
        <li>A brief vehicle orientation from our team</li>
        <li>A guided test drive experience</li>
        <li>Time to discuss any questions you may have</li>
      </ul>
    </div>

    <p>Your signed test drive agreement is attached to this email for your records.</p>

    <div class="footer">
      <p>If you need to reschedule or have any questions, please contact us:</p>
      <div class="contact-info">
        <strong>${dealershipName}</strong><br>
        Phone: ${dealershipPhone}
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        This email was sent by AutoLead.ai on behalf of ${dealershipName}.
      </p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
Dear ${customerName},

Thank you for booking a test drive with us. Your appointment has been confirmed!

BOOKING DETAILS
---------------
Vehicle: ${vehicleInfo}
Date: ${formattedDate}
Time: ${scheduledTime || 'TBD'}
Consultant: ${salesExecutiveName}

WHAT TO BRING
-------------
- Your valid driving license (the one used for verification)
- Emirates ID (if applicable)

WHAT TO EXPECT
--------------
- A brief vehicle orientation from our team
- A guided test drive experience
- Time to discuss any questions you may have

Your signed test drive agreement is attached to this email for your records.

If you need to reschedule or have any questions, please contact us:
${dealershipName}
Phone: ${dealershipPhone}

---
This email was sent by AutoLead.ai on behalf of ${dealershipName}.
`;

  const attachments = pdfAttachment
    ? [
        {
          filename: 'Test_Drive_Agreement.pdf',
          content: pdfAttachment,
          contentType: 'application/pdf',
        },
      ]
    : undefined;

  return sendEmail({
    to,
    subject,
    html,
    text,
    attachments,
  });
}
