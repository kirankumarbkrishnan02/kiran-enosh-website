const { google } = require('googleapis');
require('dotenv').config();

// ============================================================
// SETUP GMAIL API (Using OAuth2)
// ============================================================
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

console.log('📧 Gmail API Mailer initialized');

// Helper function to send emails via Gmail API
async function sendMail({ to, subject, html }) {
  try {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: "Kiran Enosh Support" <${process.env.EMAIL_USER}>`,
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      html,
    ];
    const message = messageParts.join('\n');
    
    // Encode the message for Gmail API
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });
    
    console.log(`📧 Email sent to ${to} (ID: ${res.data.id})`);
    return res;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

// ============================================================
// 1. HELPDESK: NOTIFY ADMIN
// ============================================================
async function sendHelpdeskNotification({ student, subject, message, ticketId }) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f8fc; padding: 30px;">
      <h1 style="color: #ff7b00;">🎫 NEW HELPDESK TICKET #${ticketId}</h1>
      <p><strong>Student Name:</strong> ${student.name}</p>
      <p><strong>Email:</strong> ${student.email}</p>
      <p><strong>Phone:</strong> ${student.phone}</p>
      <hr style="border: 1px solid #ddd; margin: 20px 0;">
      <h3>Subject: ${subject}</h3>
      <p style="background: #fff; padding: 15px; border-left: 4px solid #4a90e2;">${message}</p>
    </div>
  `;

  return sendMail({ to: adminEmail, subject: `🎫 Helpdesk #${ticketId} - ${subject}`, html });
}

// ============================================================
// 2. HELPDESK: CONFIRM TO STUDENT
// ============================================================
async function sendHelpdeskConfirmation({ student, subject, ticketId }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f8fc; padding: 30px;">
      <h1 style="color: #0a1128;">We received your query!</h1>
      <p>Hi ${student.name},</p>
      <p>Thank you for contacting Kiran Enosh. We have received your ticket <strong>#${ticketId}</strong> regarding: <em>${subject}</em>.</p>
      <p>Our team will get in touch with you at <strong>${student.email}</strong> and <strong>${student.phone}</strong> within 24 hours.</p>
    </div>
  `;

  return sendMail({ to: student.email, subject: `✅ We received your query #${ticketId}`, html });
}

// ============================================================
// 3. HELPDESK: ADMIN REPLIES TO STUDENT
// ============================================================
async function sendTicketReply({ to, name, subject, reply }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f8fc; padding: 30px;">
      <h1 style="color: #ff7b00;">Kiran Enosh Support</h1>
      <p>Hi ${name},</p>
      <p>Our team has replied to your ticket:</p>
      <div style="background: #fff; padding: 15px; border-left: 4px solid #4a90e2; margin: 20px 0;">
        <strong>Your Subject:</strong> ${subject}<br><br>
        <strong>Our Reply:</strong><br>${reply}
      </div>
    </div>
  `;

  return sendMail({ to: to, subject: `Reply to your ticket - Kiran Enosh`, html });
}

// ============================================================
// 4. PASSWORD RESET (Optional)
// ============================================================
async function sendPasswordResetEmail({ to, name, resetLink }) {
  const html = `<div><h1>Reset Password</h1><p>Hi ${name},</p><a href="${resetLink}">Click here</a></div>`;
  return sendMail({ to: to, subject: `Reset Your Password - Kiran Enosh`, html });
}

module.exports = {
  sendPasswordResetEmail,
  sendHelpdeskNotification,
  sendHelpdeskConfirmation,
  sendTicketReply,
};