const nodemailer = require('nodemailer');

// ============================================================
// 1. TRANSPORTER SETUP (Forced to Port 587 for Render)
// ============================================================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection at startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Mailer verification failed:', error.message);
  } else {
    console.log('📧 Mailer ready — emails will be sent from', process.env.EMAIL_USER);
  }
});

// ============================================================
// 2. PASSWORD RESET EMAIL
// ============================================================
async function sendPasswordResetEmail({ to, name, resetLink }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f8fc; padding: 30px 20px;">
      <div style="background: #0a1128; padding: 25px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #ff7b00; margin: 0; font-size: 24px;">KIRAN ENOSH</h1>
      </div>
      <div style="background: #ffffff; padding: 35px 30px; border-radius: 0 0 12px 12px;">
        <h2 style="color: #0a1128; margin-top: 0; font-size: 22px;">Reset Your Password</h2>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">Hi ${name || 'Student'},</p>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">Click the button below to reset your password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #ff7b00, #ff5500); color: #ffffff; text-decoration: none; border-radius: 30px; font-weight: 700;">Reset My Password →</a>
        </div>
        <p style="color: #666; font-size: 13px;">This link is valid for 1 hour.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: to,
    subject: 'Reset Your Password — Kiran Enosh',
    html: html,
  });
}

// ============================================================
// 3. HELPDESK: NOTIFY ADMIN
// ============================================================
async function sendHelpdeskNotification({ student, subject, message, ticketId }) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #f6f8fc; padding: 30px 20px;">
      <div style="background: #0a1128; padding: 22px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #ff7b00; margin: 0; font-size: 22px;">🎫 NEW HELPDESK TICKET</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px;">
        <p style="color: #666; font-size: 13px; margin: 0 0 5px;">Ticket #${ticketId}</p>
        <h2 style="color: #0a1128; font-size: 20px; margin: 20px 0;">Student Details</h2>
        <p><strong>Name:</strong> ${student.name}</p>
        <p><strong>Email:</strong> ${student.email}</p>
        <p><strong>Phone:</strong> ${student.phone}</p>
        <h2 style="color: #0a1128; font-size: 20px; margin: 20px 0 10px;">Subject</h2>
        <p style="background: #f6f8fc; padding: 15px; border-left: 4px solid #ff7b00;">${subject}</p>
        <h2 style="color: #0a1128; font-size: 20px; margin: 20px 0 10px;">Message</h2>
        <p style="background: #f6f8fc; padding: 15px; border-left: 4px solid #0a4da6; white-space: pre-wrap;">${message}</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: adminEmail,
    replyTo: student.email,
    subject: `🎫 Helpdesk Ticket #${ticketId} — ${subject}`,
    html: html,
  });
}

// ============================================================
// 4. HELPDESK: CONFIRM TO STUDENT
// ============================================================
async function sendHelpdeskConfirmation({ student, subject, ticketId }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f8fc; padding: 30px;">
      <h1 style="color: #0a1128;">We received your query!</h1>
      <p>Hi ${student.name},</p>
      <p>Thank you for contacting Kiran Enosh. We have received your ticket <strong>#${ticketId}</strong> regarding: <em>${subject}</em>.</p>
      <p>Our team will get in touch with you at <strong>${student.email}</strong> and <strong>${student.phone}</strong> within 24 hours.</p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated confirmation. Please do not reply to this email.</p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: student.email,
    subject: `✅ We received your query #${ticketId}`,
    html: html,
  });
}

// ============================================================
// 5. HELPDESK: ADMIN REPLIES TO STUDENT
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
      <p>If you have any more questions, feel free to contact us.</p>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: to,
    subject: `Reply to your ticket - Kiran Enosh`,
    html: html,
  });
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  sendPasswordResetEmail,
  sendHelpdeskNotification,
  sendHelpdeskConfirmation,
  sendTicketReply,
};